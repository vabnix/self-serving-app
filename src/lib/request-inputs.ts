import type { CatalogItem } from "@/lib/catalog";
import { generateNames, slugify } from "@/lib/naming";
import {
  environments,
  isExpiryRequired,
  sizes,
  teams,
  today,
} from "@/lib/request-options";
import type { NewRequest, TerraformInputs } from "@/lib/requests";

type Parsed = { ok: true; request: NewRequest } | { ok: false; error: string };

const fail = (error: string): Parsed => ({ ok: false, error });

// Validates a submitted request form and turns it into the record to store
// and the inputs to pass to the Terraform template.
export function parseRequest(item: CatalogItem, data: FormData): Parsed {
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

  const size = item.sizing ? text("size") : undefined;
  if (item.sizing && !sizes.some((option) => option.value === size)) {
    return fail("Select a size.");
  }

  const technicalContact = text("technical_contact");
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(technicalContact)) {
    return fail("Enter an email address for the technical point of contact.");
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
    ...(size && { size }),
    ...(expiresOn && { expires_on: expiresOn }),
    resource_names: Object.fromEntries(
      generateNames(item.id, { name, team, environment }).map((generated) => [
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

  return {
    ok: true,
    request: {
      name,
      templateId: item.id,
      team,
      environment,
      size,
      technicalContact,
      expiresOn,
      inputs,
    },
  };
}
