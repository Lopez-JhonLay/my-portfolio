import { ArrowDown, ArrowUp, Plus, Trash2 } from "lucide-react";

import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Textarea } from "../../components/ui/textarea";
import { TECHNOLOGY_ICON_KEYS } from "./content-contract";
import type {
  AboutDocument,
  ContactDocument,
  ContentFieldErrors,
  HeroDocument,
  TechnologiesDocument,
  TimelineDocument,
} from "./content-contract";
import { moveContentItem } from "./content-ordering";

function Field({
  error,
  label,
  children,
}: {
  readonly error?: string;
  readonly label: string;
  readonly children: React.ReactNode;
}) {
  return (
    <label className="content-field">
      <span>{label}</span>
      {children}
      {error ? <small className="field-error">{error}</small> : null}
    </label>
  );
}

export function HeroFields({
  document,
  errors,
  onChange,
}: {
  readonly document: HeroDocument;
  readonly errors: ContentFieldErrors;
  readonly onChange: (document: HeroDocument) => void;
}) {
  const text =
    (field: keyof HeroDocument) =>
    (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      onChange({ ...document, [field]: event.target.value });
  return (
    <>
      <section className="content-form-section">
        <h2>Personal information</h2>
        <div className="content-field-grid">
          <Field label="Name" error={errors.name}>
            <Input value={document.name} onChange={text("name")} />
          </Field>
          <Field label="Full role" error={errors.role}>
            <Input value={document.role} onChange={text("role")} />
          </Field>
          <Field label="Displayed role" error={errors.heroRole}>
            <Input value={document.heroRole} onChange={text("heroRole")} />
          </Field>
          <Field label="Location" error={errors.location}>
            <Input value={document.location} onChange={text("location")} />
          </Field>
          <Field label="Description" error={errors.description}>
            <Textarea
              value={document.description}
              onChange={text("description")}
            />
          </Field>
        </div>
      </section>
    </>
  );
}

function RowActions({
  canRemove,
  index,
  length,
  move,
  remove,
}: {
  readonly canRemove: boolean;
  readonly index: number;
  readonly length: number;
  readonly move: (from: number, to: number) => void;
  readonly remove: (index: number) => void;
}) {
  return (
    <div className="content-row-actions">
      <Button
        aria-label="Move up"
        disabled={index === 0}
        onClick={() => move(index, index - 1)}
        size="icon"
        type="button"
        variant="outline"
      >
        <ArrowUp />
      </Button>
      <Button
        aria-label="Move down"
        disabled={index === length - 1}
        onClick={() => move(index, index + 1)}
        size="icon"
        type="button"
        variant="outline"
      >
        <ArrowDown />
      </Button>
      <Button
        aria-label="Remove"
        disabled={!canRemove}
        onClick={() => remove(index)}
        size="icon"
        type="button"
        variant="outline"
      >
        <Trash2 />
      </Button>
    </div>
  );
}

export function AboutFields({
  document,
  errors,
  onChange,
}: {
  readonly document: AboutDocument;
  readonly errors: ContentFieldErrors;
  readonly onChange: (document: AboutDocument) => void;
}) {
  return (
    <>
      <section className="content-form-section">
        <div className="content-section-heading">
          <div>
            <h2>Paragraphs</h2>
            <p>Displayed in this order.</p>
          </div>
          <Button
            type="button"
            variant="outline"
            onClick={() =>
              onChange({
                ...document,
                paragraphs: [...document.paragraphs, ""],
              })
            }
          >
            <Plus /> Add paragraph
          </Button>
        </div>
        <div className="content-array-list">
          {document.paragraphs.map((paragraph, index) => (
            <div className="content-array-row" key={index}>
              <Field
                label={`Paragraph ${index + 1}`}
                error={errors[`paragraphs.${index}`]}
              >
                <Textarea
                  value={paragraph}
                  onChange={(event) =>
                    onChange({
                      ...document,
                      paragraphs: document.paragraphs.map((item, itemIndex) =>
                        itemIndex === index ? event.target.value : item,
                      ),
                    })
                  }
                />
              </Field>
              <RowActions
                canRemove={document.paragraphs.length > 1}
                index={index}
                length={document.paragraphs.length}
                move={(from, to) =>
                  onChange({
                    ...document,
                    paragraphs: moveContentItem(document.paragraphs, from, to),
                  })
                }
                remove={(itemIndex) =>
                  onChange({
                    ...document,
                    paragraphs: document.paragraphs.filter(
                      (_, candidate) => candidate !== itemIndex,
                    ),
                  })
                }
              />
            </div>
          ))}
        </div>
      </section>
      <section className="content-form-section">
        <div className="content-section-heading">
          <div>
            <h2>Facts</h2>
            <p>Displayed in this order.</p>
          </div>
          <Button
            type="button"
            variant="outline"
            onClick={() =>
              onChange({
                ...document,
                facts: [...document.facts, { label: "", value: "" }],
              })
            }
          >
            <Plus /> Add fact
          </Button>
        </div>
        <div className="content-array-list">
          {document.facts.map((fact, index) => (
            <div className="content-array-row" key={index}>
              <div className="content-field-grid">
                <Field label="Label" error={errors[`facts.${index}.label`]}>
                  <Input
                    value={fact.label}
                    onChange={(event) =>
                      onChange({
                        ...document,
                        facts: document.facts.map((item, itemIndex) =>
                          itemIndex === index
                            ? { ...item, label: event.target.value }
                            : item,
                        ),
                      })
                    }
                  />
                </Field>
                <Field label="Value" error={errors[`facts.${index}.value`]}>
                  <Input
                    value={fact.value}
                    onChange={(event) =>
                      onChange({
                        ...document,
                        facts: document.facts.map((item, itemIndex) =>
                          itemIndex === index
                            ? { ...item, value: event.target.value }
                            : item,
                        ),
                      })
                    }
                  />
                </Field>
              </div>
              <RowActions
                canRemove={document.facts.length > 1}
                index={index}
                length={document.facts.length}
                move={(from, to) =>
                  onChange({
                    ...document,
                    facts: moveContentItem(document.facts, from, to),
                  })
                }
                remove={(itemIndex) =>
                  onChange({
                    ...document,
                    facts: document.facts.filter(
                      (_, candidate) => candidate !== itemIndex,
                    ),
                  })
                }
              />
            </div>
          ))}
        </div>
      </section>
    </>
  );
}

export function ContactFields({
  document,
  errors,
  onChange,
}: {
  readonly document: ContactDocument;
  readonly errors: ContentFieldErrors;
  readonly onChange: (document: ContactDocument) => void;
}) {
  const text =
    (field: Exclude<keyof ContactDocument, "socialLinks">) =>
    (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      onChange({ ...document, [field]: event.target.value });
  return (
    <>
      <section className="content-form-section">
        <h2>Contact information</h2>
        <div className="content-field-grid">
          <Field label="Availability" error={errors.availability}>
            <Textarea
              value={document.availability}
              onChange={text("availability")}
            />
          </Field>
          <Field label="Contact message" error={errors.noteBody}>
            <Textarea value={document.noteBody} onChange={text("noteBody")} />
          </Field>
          <Field label="Email" error={errors.email}>
            <Input
              type="email"
              value={document.email}
              onChange={text("email")}
            />
          </Field>
        </div>
      </section>
      <section className="content-form-section">
        <div className="content-section-heading">
          <div>
            <h2>Social links</h2>
            <p>Choose from the built-in icon catalog.</p>
          </div>
          <Button
            type="button"
            variant="outline"
            onClick={() =>
              onChange({
                ...document,
                socialLinks: [
                  ...document.socialLinks,
                  { label: "", href: "https://", iconKey: "external" },
                ],
              })
            }
          >
            <Plus /> Add link
          </Button>
        </div>
        <div className="content-array-list">
          {document.socialLinks.map((link, index) => (
            <div className="content-array-row" key={index}>
              <div className="content-field-grid content-field-grid--three">
                <Field
                  label="Label"
                  error={errors[`socialLinks.${index}.label`]}
                >
                  <Input
                    value={link.label}
                    onChange={(event) =>
                      onChange({
                        ...document,
                        socialLinks: document.socialLinks.map(
                          (item, itemIndex) =>
                            itemIndex === index
                              ? { ...item, label: event.target.value }
                              : item,
                        ),
                      })
                    }
                  />
                </Field>
                <Field label="URL" error={errors[`socialLinks.${index}.href`]}>
                  <Input
                    value={link.href}
                    onChange={(event) =>
                      onChange({
                        ...document,
                        socialLinks: document.socialLinks.map(
                          (item, itemIndex) =>
                            itemIndex === index
                              ? { ...item, href: event.target.value }
                              : item,
                        ),
                      })
                    }
                  />
                </Field>
                <Field
                  label="Icon"
                  error={errors[`socialLinks.${index}.iconKey`]}
                >
                  <select
                    value={link.iconKey}
                    onChange={(event) =>
                      onChange({
                        ...document,
                        socialLinks: document.socialLinks.map(
                          (item, itemIndex) =>
                            itemIndex === index
                              ? {
                                  ...item,
                                  iconKey: event.target
                                    .value as ContactDocument["socialLinks"][number]["iconKey"],
                                }
                              : item,
                        ),
                      })
                    }
                  >
                    <option value="github">GitHub</option>
                    <option value="linkedin">LinkedIn</option>
                    <option value="facebook">Facebook</option>
                    <option value="external">External</option>
                  </select>
                </Field>
              </div>
              <RowActions
                canRemove
                index={index}
                length={document.socialLinks.length}
                move={(from, to) =>
                  onChange({
                    ...document,
                    socialLinks: moveContentItem(
                      document.socialLinks,
                      from,
                      to,
                    ),
                  })
                }
                remove={(itemIndex) =>
                  onChange({
                    ...document,
                    socialLinks: document.socialLinks.filter(
                      (_, candidate) => candidate !== itemIndex,
                    ),
                  })
                }
              />
            </div>
          ))}
        </div>
      </section>
    </>
  );
}

export function TimelineFields({
  document,
  errors,
  onChange,
}: {
  readonly document: TimelineDocument;
  readonly errors: ContentFieldErrors;
  readonly onChange: (document: TimelineDocument) => void;
}) {
  const changeEntry = (
    index: number,
    field: keyof TimelineDocument["entries"][number],
    value: string,
  ) =>
    onChange({
      ...document,
      entries: document.entries.map((entry, candidate) =>
        candidate === index ? { ...entry, [field]: value } : entry,
      ),
    });
  return (
    <>
      <section className="content-form-section">
        <div className="content-section-heading">
          <div>
            <h2>Timeline entries</h2>
            <p>Displayed in this order.</p>
          </div>
          <Button
            type="button"
            variant="outline"
            onClick={() =>
              onChange({
                ...document,
                entries: [
                  ...document.entries,
                  {
                    role: "",
                    organization: "",
                    location: "",
                    date: "",
                    detail: "",
                  },
                ],
              })
            }
          >
            <Plus /> Add entry
          </Button>
        </div>
        <div className="content-array-list">
          {document.entries.map((entry, index) => (
            <div className="content-array-row" key={index}>
              <div className="content-field-grid">
                <Field
                  label="Role or title"
                  error={errors[`entries.${index}.role`]}
                >
                  <Input
                    value={entry.role}
                    onChange={(event) =>
                      changeEntry(index, "role", event.target.value)
                    }
                  />
                </Field>
                <Field
                  label="Organization"
                  error={errors[`entries.${index}.organization`]}
                >
                  <Input
                    value={entry.organization}
                    onChange={(event) =>
                      changeEntry(index, "organization", event.target.value)
                    }
                  />
                </Field>
                <Field label="Date" error={errors[`entries.${index}.date`]}>
                  <Input
                    value={entry.date}
                    onChange={(event) =>
                      changeEntry(index, "date", event.target.value)
                    }
                  />
                </Field>
                <Field
                  label="Location"
                  error={errors[`entries.${index}.location`]}
                >
                  <Input
                    value={entry.location}
                    onChange={(event) =>
                      changeEntry(index, "location", event.target.value)
                    }
                  />
                </Field>
                <Field
                  label="Description"
                  error={errors[`entries.${index}.detail`]}
                >
                  <Textarea
                    value={entry.detail}
                    onChange={(event) =>
                      changeEntry(index, "detail", event.target.value)
                    }
                  />
                </Field>
              </div>
              <RowActions
                canRemove={document.entries.length > 1}
                index={index}
                length={document.entries.length}
                move={(from, to) =>
                  onChange({
                    ...document,
                    entries: moveContentItem(document.entries, from, to),
                  })
                }
                remove={(itemIndex) =>
                  onChange({
                    ...document,
                    entries: document.entries.filter(
                      (_, candidate) => candidate !== itemIndex,
                    ),
                  })
                }
              />
            </div>
          ))}
        </div>
      </section>
    </>
  );
}

export function TechnologiesFields({
  document,
  errors,
  onChange,
}: {
  readonly document: TechnologiesDocument;
  readonly errors: ContentFieldErrors;
  readonly onChange: (document: TechnologiesDocument) => void;
}) {
  return (
    <>
      <section className="content-form-section">
        <div className="content-section-heading">
          <div>
            <h2>Technology categories</h2>
            <p>Categories and technologies display in this order.</p>
          </div>
          <Button
            type="button"
            variant="outline"
            onClick={() =>
              onChange({
                ...document,
                groups: [
                  ...document.groups,
                  { category: "", technologies: [{ name: "" }] },
                ],
              })
            }
          >
            <Plus /> Add category
          </Button>
        </div>
        <div className="content-array-list">
          {document.groups.map((group, groupIndex) => (
            <div className="technology-group-editor" key={groupIndex}>
              <div className="content-array-row">
                <Field
                  label="Category"
                  error={errors[`groups.${groupIndex}.category`]}
                >
                  <Input
                    value={group.category}
                    onChange={(event) =>
                      onChange({
                        ...document,
                        groups: document.groups.map((item, index) =>
                          index === groupIndex
                            ? { ...item, category: event.target.value }
                            : item,
                        ),
                      })
                    }
                  />
                </Field>
                <RowActions
                  canRemove={document.groups.length > 1}
                  index={groupIndex}
                  length={document.groups.length}
                  move={(from, to) =>
                    onChange({
                      ...document,
                      groups: moveContentItem(document.groups, from, to),
                    })
                  }
                  remove={(index) =>
                    onChange({
                      ...document,
                      groups: document.groups.filter(
                        (_, candidate) => candidate !== index,
                      ),
                    })
                  }
                />
              </div>
              <div className="technology-list-heading">
                <strong>Technologies</strong>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() =>
                    onChange({
                      ...document,
                      groups: document.groups.map((item, index) =>
                        index === groupIndex
                          ? {
                              ...item,
                              technologies: [
                                ...item.technologies,
                                { name: "" },
                              ],
                            }
                          : item,
                      ),
                    })
                  }
                >
                  <Plus /> Add technology
                </Button>
              </div>
              {errors[`groups.${groupIndex}.technologies`] ? (
                <small className="field-error">
                  {errors[`groups.${groupIndex}.technologies`]}
                </small>
              ) : null}
              <div className="content-array-list">
                {group.technologies.map((technology, technologyIndex) => (
                  <div className="content-array-row" key={technologyIndex}>
                    <div className="content-field-grid">
                      <Field
                        label="Name"
                        error={
                          errors[
                            `groups.${groupIndex}.technologies.${technologyIndex}.name`
                          ]
                        }
                      >
                        <Input
                          value={technology.name}
                          onChange={(event) =>
                            onChange({
                              ...document,
                              groups: document.groups.map((item, index) =>
                                index === groupIndex
                                  ? {
                                      ...item,
                                      technologies: item.technologies.map(
                                        (entry, candidate) =>
                                          candidate === technologyIndex
                                            ? {
                                                ...entry,
                                                name: event.target.value,
                                              }
                                            : entry,
                                      ),
                                    }
                                  : item,
                              ),
                            })
                          }
                        />
                      </Field>
                      <Field label="Icon">
                        <select
                          value={technology.iconKey ?? ""}
                          onChange={(event) =>
                            onChange({
                              ...document,
                              groups: document.groups.map((item, index) =>
                                index === groupIndex
                                  ? {
                                      ...item,
                                      technologies: item.technologies.map(
                                        (entry, candidate) =>
                                          candidate === technologyIndex
                                            ? {
                                                name: entry.name,
                                                ...(event.target.value
                                                  ? {
                                                      iconKey: event.target
                                                        .value as TechnologiesDocument["groups"][number]["technologies"][number]["iconKey"],
                                                    }
                                                  : {}),
                                              }
                                            : entry,
                                      ),
                                    }
                                  : item,
                              ),
                            })
                          }
                        >
                          <option value="">No icon</option>
                          {TECHNOLOGY_ICON_KEYS.map((iconKey) => (
                            <option key={iconKey} value={iconKey}>
                              {iconKey}
                            </option>
                          ))}
                        </select>
                      </Field>
                    </div>
                    <RowActions
                      canRemove={group.technologies.length > 1}
                      index={technologyIndex}
                      length={group.technologies.length}
                      move={(from, to) =>
                        onChange({
                          ...document,
                          groups: document.groups.map((item, index) =>
                            index === groupIndex
                              ? {
                                  ...item,
                                  technologies: moveContentItem(
                                    item.technologies,
                                    from,
                                    to,
                                  ),
                                }
                              : item,
                          ),
                        })
                      }
                      remove={(index) =>
                        onChange({
                          ...document,
                          groups: document.groups.map((item, candidate) =>
                            candidate === groupIndex
                              ? {
                                  ...item,
                                  technologies: item.technologies.filter(
                                    (_, technologyCandidate) =>
                                      technologyCandidate !== index,
                                  ),
                                }
                              : item,
                          ),
                        })
                      }
                    />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
