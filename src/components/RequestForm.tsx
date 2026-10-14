"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { submitRequest } from "@/app/actions";
import type { CatalogItem, Question } from "@/lib/catalog";
import { generateNames } from "@/lib/naming";
import {
  environments,
  isExpiryRequired,
  sizes,
  teams,
  today,
  type Size,
} from "@/lib/request-options";

const labelClass = "text-sm font-semibold";
const fieldClass = "field";
const helpClass = "mt-1.5 text-xs text-zinc-500";

function QuestionField({ question }: { question: Question }) {
  const helpId = question.help ? `${question.name}-help` : undefined;
  const help = question.help && (
    <p id={helpId} className={helpClass}>
      {question.help}
    </p>
  );

  if (question.type === "boolean") {
    return (
      <div className="self-start rounded-lg p-4 ring-1 ring-zinc-950/10 has-checked:bg-blue-50/50 has-checked:ring-blue-600/30">
        <label className="flex items-center gap-3 text-sm font-semibold">
          <input
            type="checkbox"
            name={question.name}
            defaultChecked={question.defaultValue}
            aria-describedby={helpId}
            className="size-4 accent-blue-600"
          />
          {question.label}
        </label>
        {question.help && (
          <p id={helpId} className="mt-1 ml-7 text-xs text-zinc-500">
            {question.help}
          </p>
        )}
      </div>
    );
  }

  const required = question.type !== "text" || question.required;

  return (
    <div>
      <label htmlFor={question.name} className={labelClass}>
        {question.label}
        {required && " *"}
      </label>
      {question.type === "select" && (
        <select
          id={question.name}
          name={question.name}
          required
          aria-describedby={helpId}
          className={fieldClass}
        >
          {question.options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      )}
      {question.type === "text" && (
        <input
          id={question.name}
          name={question.name}
          required={question.required}
          pattern={question.pattern}
          placeholder={question.placeholder}
          aria-describedby={helpId}
          className={fieldClass}
        />
      )}
      {question.type === "number" && (
        <input
          id={question.name}
          name={question.name}
          type="number"
          required
          min={question.min}
          max={question.max}
          defaultValue={question.defaultValue}
          aria-describedby={helpId}
          className={fieldClass}
        />
      )}
      {help}
    </div>
  );
}

export default function RequestForm({
  templateId,
  sizing,
  costNote,
  questions,
}: {
  templateId: string;
  sizing: CatalogItem["sizing"];
  costNote: CatalogItem["costNote"];
  questions: Question[];
}) {
  const [size, setSize] = useState<Size>("small");
  const [basics, setBasics] = useState({
    name: "",
    team: "",
    environment: environments[0].value,
  });
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const cost = sizing?.cost?.[size] ?? costNote;
  const generatedNames = generateNames(templateId, basics);
  const expiryRequired = isExpiryRequired(basics.environment);

  function handleChange(event: React.FormEvent<HTMLFormElement>) {
    const data = new FormData(event.currentTarget);
    setBasics({
      name: String(data.get("name") ?? ""),
      team: String(data.get("team") ?? ""),
      environment: String(data.get("environment") ?? ""),
    });
    setError(null);

    const expiry = event.currentTarget.elements.namedItem("expires_on");
    if (expiry instanceof HTMLInputElement) {
      expiry.setCustomValidity(
        expiry.value && expiry.value <= today() ? "Choose a future date." : "",
      );
    }
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    setError(null);
    startTransition(async () => {
      // On success the action redirects to the new request's page.
      const result = await submitRequest(templateId, data);
      if (result?.error) setError(result.error);
    });
  }

  return (
    <form
      onSubmit={handleSubmit}
      onChange={handleChange}
      className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]"
    >
      <div className="card flex flex-col gap-8 p-6 sm:p-8">
        <section>
          <h2 className="eyebrow">Basics</h2>
          <div className="mt-5 grid gap-x-5 gap-y-6 sm:grid-cols-2">
            <div>
              <label htmlFor="name" className={labelClass}>
                Name *
              </label>
              <input
                id="name"
                name="name"
                required
                pattern=".*[A-Za-z0-9].*"
                title="Include at least one letter or number"
                maxLength={40}
                placeholder="e.g., Orders API"
                aria-describedby="name-hint"
                className={fieldClass}
              />
              <p id="name-hint" className={helpClass}>
                A short name for what this is for. The Azure resource names are
                generated from it.
              </p>
            </div>

            <div>
              <label htmlFor="team" className={labelClass}>
                Team *
              </label>
              <select
                id="team"
                name="team"
                required
                defaultValue=""
                className={fieldClass}
              >
                <option value="" disabled>
                  Select a team
                </option>
                {teams.map((team) => (
                  <option key={team}>{team}</option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="environment" className={labelClass}>
                Environment *
              </label>
              <select
                id="environment"
                name="environment"
                required
                className={fieldClass}
              >
                {environments.map((environment) => (
                  <option key={environment.value} value={environment.value}>
                    {environment.label}
                  </option>
                ))}
              </select>
            </div>

            {sizing && (
              <div>
                <label htmlFor="size" className={labelClass}>
                  Size *
                </label>
                <select
                  id="size"
                  name="size"
                  required
                  value={size}
                  onChange={(event) => setSize(event.target.value as Size)}
                  aria-describedby="size-hint"
                  className={fieldClass}
                >
                  {sizes.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                <p id="size-hint" className={helpClass}>
                  {sizing.help}
                </p>
              </div>
            )}

            <div>
              <label htmlFor="technical_contact" className={labelClass}>
                Technical point of contact *
              </label>
              <input
                id="technical_contact"
                name="technical_contact"
                type="email"
                required
                placeholder="e.g., jane.doe@example.com"
                aria-describedby="technical-contact-hint"
                className={fieldClass}
              />
              <p id="technical-contact-hint" className={helpClass}>
                Email of the person to reach about this resource.
              </p>
            </div>

            <div>
              <label htmlFor="expires_on" className={labelClass}>
                Resource expiry date{expiryRequired && " *"}
              </label>
              <input
                id="expires_on"
                name="expires_on"
                type="date"
                required={expiryRequired}
                aria-describedby="expires-on-hint"
                className={fieldClass}
              />
              <p id="expires-on-hint" className={helpClass}>
                {expiryRequired
                  ? "The resource is flagged for removal after this date."
                  : "Optional for production. Leave blank to keep the resource."}
              </p>
            </div>
          </div>
        </section>

        {questions.length > 0 && (
          <fieldset className="border-t border-zinc-950/5 pt-8">
            <legend className="sr-only">Service settings</legend>
            <h2 className="eyebrow">Service settings</h2>
            <div className="mt-5 grid gap-x-5 gap-y-6 sm:grid-cols-2">
              {questions.map((question) => (
                <QuestionField key={question.name} question={question} />
              ))}
            </div>
          </fieldset>
        )}
      </div>

      <aside className="card flex flex-col gap-5 p-6 lg:sticky lg:top-24">
        <h2 className="eyebrow">Summary</h2>
        {cost && (
          <p className="rounded-xl bg-linear-to-r from-blue-50 to-indigo-50 p-4 ring-1 ring-blue-600/15 ring-inset">
            <span className="block text-sm font-semibold text-blue-900">
              Estimated Cost
            </span>
            <span className="mt-1 block text-lg font-semibold text-blue-700 tabular-nums">
              {cost}
            </span>
          </p>
        )}

        <div>
          <h3 className="text-sm font-semibold">Azure resource names</h3>
          {generatedNames.length === 0 ? (
            <p className="mt-1.5 text-xs text-zinc-500">
              Enter a name to preview the names that will be created.
            </p>
          ) : (
            <dl className="mt-3 flex flex-col gap-2.5" aria-live="polite">
              {generatedNames.map((generated) => (
                <div key={generated.key}>
                  <dt className="text-xs text-zinc-500">{generated.label}</dt>
                  <dd className="mt-0.5 font-mono text-sm break-all">
                    {generated.value}
                  </dd>
                </div>
              ))}
            </dl>
          )}
        </div>

        <div className="flex flex-col gap-3">
          <button
            type="submit"
            disabled={pending}
            className="btn btn-primary py-3"
          >
            {pending ? "Submitting…" : "Submit Request"}
          </button>
          <Link href="/catalog" className="btn btn-secondary py-3">
            Cancel
          </Link>
        </div>

        {error && (
          <p
            role="alert"
            className="rounded-xl bg-red-50 p-4 text-sm font-medium text-red-800 ring-1 ring-red-600/20 ring-inset"
          >
            {error}
          </p>
        )}
      </aside>
    </form>
  );
}
