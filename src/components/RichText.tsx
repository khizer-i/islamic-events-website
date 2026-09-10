import { Fragment, type ReactNode } from "react";

/**
 * Captions arrive from Telegram written for Telegram, so they carry Markdown
 * that was rendering literally on the page — **bold** appearing as asterisks.
 *
 * This renders a deliberately tiny subset as React nodes. Nothing is ever
 * turned into HTML, so a caption cannot inject markup no matter what an
 * organiser types.
 */

const PATTERN =
  /(\*\*[^*\n]+\*\*|__[^_\n]+__|\*[^*\n]+\*|_[^_\n]+_|`[^`\n]+`|https?:\/\/[^\s<>()]+)/g;

function renderInline(text: string, keyPrefix: string): ReactNode[] {
  const nodes: ReactNode[] = [];
  let last = 0;
  let match: RegExpExecArray | null;
  let i = 0;

  PATTERN.lastIndex = 0;

  while ((match = PATTERN.exec(text)) !== null) {
    if (match.index > last) {
      nodes.push(text.slice(last, match.index));
    }

    const token = match[0];
    const key = `${keyPrefix}-${i++}`;

    if (token.startsWith("**") || token.startsWith("__")) {
      nodes.push(
        <strong key={key} className="font-semibold">
          {token.slice(2, -2)}
        </strong>
      );
    } else if (token.startsWith("`")) {
      nodes.push(<Fragment key={key}>{token.slice(1, -1)}</Fragment>);
    } else if (token.startsWith("http")) {
      // Trailing punctuation usually belongs to the sentence, not the URL.
      const trimmed = token.replace(/[.,;:!?]+$/, "");
      const tail = token.slice(trimmed.length);
      nodes.push(
        <Fragment key={key}>
          <a
            href={trimmed}
            target="_blank"
            rel="noopener noreferrer nofollow ugc"
            className="text-accent underline underline-offset-2 hover:text-accent-hover"
          >
            {trimmed.replace(/^https?:\/\//, "")}
          </a>
          {tail}
        </Fragment>
      );
    } else {
      nodes.push(
        <em key={key} className="italic">
          {token.slice(1, -1)}
        </em>
      );
    }

    last = match.index + token.length;
  }

  if (last < text.length) nodes.push(text.slice(last));
  return nodes;
}

export default function RichText({
  text,
  className = "",
}: {
  text: string;
  className?: string;
}) {
  // Collapse the runs of blank lines posters tend to carry, then keep the
  // remaining line structure — it is usually a deliberate list.
  const lines = text.replace(/\n{3,}/g, "\n\n").split("\n");

  return (
    <p className={`whitespace-pre-line ${className}`}>
      {lines.map((line, i) => (
        <Fragment key={i}>
          {i > 0 ? "\n" : null}
          {renderInline(line, `l${i}`)}
        </Fragment>
      ))}
    </p>
  );
}
