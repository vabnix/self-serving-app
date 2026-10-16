import { type CatalogItem, serviceIds } from "@/lib/catalog";
import { generateNames, slugify } from "@/lib/naming";
import {
  environments,
  isExpiryRequired,
  regions,
  resourceGroupPattern,
  teams,
  today,
} from "@/lib/request-options";
import type { NewRequest, TerraformInputs } from "@/lib/requests";

type Parsed = { ok: true; request: NewRequest } | { ok: false; error: string };

const fail = (error: string): Parsed => ({ ok: false, error });

// Validates a submitted request form and turns it into the record to store
// and the inputs to pass to the Terraform template. The requester is the
// signed-in user's name.
export function parseRequest(
  item: CatalogItem,
  data: FormData,
  requester: string,
): Parsed {
  const text = (name: string) => {
    const value = data.get(name);
    return typeof value === "string" ? value.trim() : "";
  };

  const name = text("name");
  if (!slugify(name) || name.length > 40) {
    return fail("Enter a name of up to 40 characters with a letter or number.");
  }

  const team = text("team");
  if (!teams.includes(team)) return fail("Select a team.");

  const environment = text("environment");
  if (!environments.some((option) => option.value === environment)) {
    return fail("Select an environment.");
  }

  const resourceGroup = item.needsResourceGroup
    ? text("resource_group")
    : undefined;
  if (
    item.needsResourceGroup &&
    !new RegExp(`^(?:${resourceGroupPattern})$`).test(resourceGroup ?? "")
  ) {
    return fail("Enter a valid resource group name.");
  }

  // Optional: blank keeps the resource group's region.
  const location = item.needsResourceGroup ? text("location") : "";
  if (location && !regions.some((option) => option.value === location)) {
    return fail("Select a valid region.");
  }

  const size = item.sizing ? text("size") : undefined;
  const sizeOption = item.sizing?.options.find(
    (option) => option.value === size,
  );
  if (item.sizing && !sizeOption) {
    return fail(`Select a ${item.sizing.label.toLowerCase()}.`);
  }

  const technicalContact = text("technical_contact");
  // Letters in any language, with spaces, periods, apostrophes and hyphens.
  if (
    technicalContact.length > 100 ||
    !/^\p{L}[\p{L}\p{M} .'-]*$/u.test(technicalContact)
  ) {
    return fail("Enter the full name of the technical point of contact.");
  }

  const expiresOn = text("expires_on") || undefined;
  if (!expiresOn && isExpiryRequired(environment)) {
    return fail("Choose a resource expiry date.");
  }
  if (expiresOn && !(/^\d{4}-\d{2}-\d{2}$/.test(expiresOn) && expiresOn > today())) {
    return fail("The resource expiry date must be in the future.");
  }

  const inputs: TerraformInputs = {
    template: item.id,
    name: slugify(name),
    team,
    environment,
    technical_contact: technicalContact,
    requester,
    ...(resourceGroup && { resource_group: resourceGroup }),
    ...(location && { location }),
    ...(size && { size }),
    ...(sizeOption?.components && { component_sizes: sizeOption.components }),
    ...(expiresOn && { expires_on: expiresOn }),
    resource_names: Object.fromEntries(
      generateNames(serviceIds(item.id), { name, team, environment }).map((generated) => [
        generated.key,
        generated.value,
      ]),
    ),
  };

  for (const question of item.questions) {
    const value = text(question.name);
    const invalid = fail(`Check the value for "${question.label}".`);

    if (question.type === "boolean") {
      inputs[question.name] = data.has(question.name);
    } else if (question.type === "select") {
      if (!question.options.some((option) => option.value === value)) {
        return invalid;
      }
      inputs[question.name] = value;
    } else if (question.type === "number") {
      const number = Number(value);
      if (
        !value ||
        !Number.isInteger(number) ||
        number < question.min ||
        number > question.max
      ) {
        return invalid;
      }
      inputs[question.name] = number;
    } else if (value) {
      if (
        question.pattern &&
        !new RegExp(`^(?:${question.pattern})$`).test(value)
      ) {
        return invalid;
      }
      inputs[question.name] = value;
    } else if (question.required) {
      return invalid;
    }
  }

  const asked = (name: string) =>
    item.questions.some((question) => question.name === name);
  const invalidCombination = item.validate?.(inputs, asked);
  if (invalidCombination) return fail(invalidCombination);

  return {
    ok: true,
    request: {
      name,
      templateId: item.id,
      team,
      environment,
      size,
      technicalContact,
      requester,
      expiresOn,
      inputs,
    },
  };
}
