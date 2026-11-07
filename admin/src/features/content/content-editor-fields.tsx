import { ArrowDown, ArrowUp, Plus, Trash2 } from "lucide-react";

import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Textarea } from "../../components/ui/textarea";
import type {
  AboutDocument,
  ContactDocument,
  ContentFieldErrors,
  HeroDocument,
} from "./content-contract";

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
        <h2>Identity and browser</h2>
        <div className="content-field-grid">
          <Field label="Browser title" error={errors.browserTitle}>
            <Input
              value={document.browserTitle}
              onChange={text("browserTitle")}
            />
          </Field>
          <Field label="Name" error={errors.name}>
            <Input value={document.name} onChange={text("name")} />
          </Field>
          <Field label="Brand" error={errors.brand}>
            <Input value={document.brand} onChange={text("brand")} />
          </Field>
          <Field label="Full role" error={errors.role}>
            <Input value={document.role} onChange={text("role")} />
          </Field>
          <Field label="Location" error={errors.location}>
            <Input value={document.location} onChange={text("location")} />
          </Field>
        </div>
      </section>
      <section className="content-form-section">
        <h2>Hero</h2>
        <div className="content-field-grid">
          <Field label="Section tag" error={errors.sectionTag}>
            <Input value={document.sectionTag} onChange={text("sectionTag")} />
          </Field>
          <Field label="Headline" error={errors.title}>
            <Input value={document.title} onChange={text("title")} />
          </Field>
          <Field label="Displayed role" error={errors.heroRole}>
            <Input value={document.heroRole} onChange={text("heroRole")} />
          </Field>
          <Field label="Résumé button label" error={errors.resumeButtonLabel}>
            <Input
              value={document.resumeButtonLabel}
              onChange={text("resumeButtonLabel")}
            />
          </Field>
          <Field label="Scroll cue" error={errors.scrollCue}>
            <Input value={document.scrollCue} onChange={text("scrollCue")} />
          </Field>
          <Field label="Description" error={errors.description}>
            <Textarea
              value={document.description}
              onChange={text("description")}
            />
          </Field>
        </div>
      </section>
      <section className="content-form-section">
        <h2>Navigation labels</h2>
        <p>Destinations stay fixed to preserve current navigation behavior.</p>
        <div className="content-array-list">
          {document.navigation.map((item, index) => (
            <Field
              key={item.href}
              label={item.href}
              error={errors[`navigation.${index}.label`]}
            >
              <Input
                value={item.label}
                onChange={(event) =>
                  onChange({
                    ...document,
                    navigation: document.navigation.map((entry, entryIndex) =>
                      entryIndex === index
                        ? { ...entry, label: event.target.value }
                        : entry,
                    ),
                  })
                }
              />
            </Field>
          ))}
        </div>
        {errors.navigation ? (
          <small className="field-error">{errors.navigation}</small>
        ) : null}
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

function moveItem<Item>(items: Item[], from: number, to: number): Item[] {
  const next = [...items];
  const [item] = next.splice(from, 1);
  if (item !== undefined) next.splice(to, 0, item);
  return next;
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
  const text =
    (field: "eyebrow" | "title" | "lead" | "stamp" | "photoCaptionPrefix") =>
    (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      onChange({ ...document, [field]: event.target.value });
  return (
    <>
      <section className="content-form-section">
        <h2>Section framing</h2>
        <div className="content-field-grid">
          <Field label="Eyebrow" error={errors.eyebrow}>
            <Input value={document.eyebrow} onChange={text("eyebrow")} />
          </Field>
          <Field label="Title" error={errors.title}>
            <Input value={document.title} onChange={text("title")} />
          </Field>
          <Field label="Lead" error={errors.lead}>
            <Textarea value={document.lead} onChange={text("lead")} />
          </Field>
          <Field label="Stamp" error={errors.stamp}>
            <Input value={document.stamp} onChange={text("stamp")} />
          </Field>
          <Field label="Photo caption prefix" error={errors.photoCaptionPrefix}>
            <Input
              value={document.photoCaptionPrefix}
              onChange={text("photoCaptionPrefix")}
            />
          </Field>
        </div>
      </section>
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
                    paragraphs: moveItem(document.paragraphs, from, to),
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
                    facts: moveItem(document.facts, from, to),
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
        <h2>Contact section</h2>
        <div className="content-field-grid">
          <Field label="Eyebrow" error={errors.eyebrow}>
            <Input value={document.eyebrow} onChange={text("eyebrow")} />
          </Field>
          <Field label="Title" error={errors.title}>
            <Input value={document.title} onChange={text("title")} />
          </Field>
          <Field label="Availability" error={errors.availability}>
            <Textarea
              value={document.availability}
              onChange={text("availability")}
            />
          </Field>
          <Field label="Note title" error={errors.noteTitle}>
            <Input value={document.noteTitle} onChange={text("noteTitle")} />
          </Field>
          <Field label="Note body" error={errors.noteBody}>
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
                    socialLinks: moveItem(document.socialLinks, from, to),
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
      <section className="content-form-section">
        <h2>Footer</h2>
        <div className="content-field-grid">
          <Field label="Primary line" error={errors.footerPrimary}>
            <Input
              value={document.footerPrimary}
              onChange={text("footerPrimary")}
            />
          </Field>
          <Field label="Secondary line" error={errors.footerSecondary}>
            <Input
              value={document.footerSecondary}
              onChange={text("footerSecondary")}
            />
          </Field>
        </div>
      </section>
    </>
  );
}
