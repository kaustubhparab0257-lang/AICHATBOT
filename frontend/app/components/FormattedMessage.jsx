const sentenceRegex = /(?<=[.!?])\s+(?=[A-Z0-9])/;

function inlineMarkdown(text) {
  const parts = text.split(/(\*\*[^*]+\*\*|`[^`]+`)/g).filter(Boolean);

  return parts.map((part, index) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return (
        <strong key={index} className="font-black text-violet-700">
          {part.slice(2, -2)}
        </strong>
      );
    }

    if (part.startsWith("`") && part.endsWith("`")) {
      return (
        <code
          key={index}
          className="rounded-lg border border-violet-100 bg-violet-50 px-1.5 py-0.5 text-[0.9em] text-violet-700"
        >
          {part.slice(1, -1)}
        </code>
      );
    }

    return part;
  });
}

function cleanText(text) {
  return text.replace(/\s+/g, " ").trim();
}

function splitPlainAnswer(text) {
  const sentences = text.split(sentenceRegex).map(cleanText).filter(Boolean);

  if (sentences.length < 3) {
    return [{ type: "paragraph", text }];
  }

  return [
    {
      type: "list",
      ordered: false,
      items: sentences,
    },
  ];
}

function parseMarkdown(text) {
  const lines = text.replace(/\r\n/g, "\n").split("\n");
  const blocks = [];
  let currentList = null;
  let paragraph = [];
  let codeBlock = null;

  const flushParagraph = () => {
    if (!paragraph.length) return;
    const paragraphText = cleanText(paragraph.join(" "));
    blocks.push(...splitPlainAnswer(paragraphText));
    paragraph = [];
  };

  const flushList = () => {
    if (!currentList) return;
    blocks.push(currentList);
    currentList = null;
  };

  lines.forEach((line) => {
    const trimmed = line.trim();

    if (trimmed.startsWith("```")) {
      flushParagraph();
      flushList();

      if (codeBlock) {
        blocks.push(codeBlock);
        codeBlock = null;
      } else {
        codeBlock = { type: "code", text: "" };
      }
      return;
    }

    if (codeBlock) {
      codeBlock.text += `${line}\n`;
      return;
    }

    if (!trimmed) {
      flushParagraph();
      flushList();
      return;
    }

    const heading = trimmed.match(/^#{1,4}\s+(.+)$/);
    const bullet = trimmed.match(/^[-*]\s+(.+)$/);
    const numbered = trimmed.match(/^\d+[.)]\s+(.+)$/);
    const simpleHeading =
      trimmed.length <= 72 &&
      !trimmed.endsWith(".") &&
      (trimmed.endsWith(":") || /^[A-Z][A-Za-z0-9\s/&-]+$/.test(trimmed));

    if (heading || simpleHeading) {
      flushParagraph();
      flushList();
      blocks.push({
        type: "heading",
        text: cleanText((heading?.[1] || trimmed).replace(/:$/, "")),
      });
      return;
    }

    if (bullet || numbered) {
      flushParagraph();
      const ordered = Boolean(numbered);
      const item = cleanText((bullet?.[1] || numbered?.[1] || "").trim());

      if (!currentList || currentList.ordered !== ordered) {
        flushList();
        currentList = {
          type: "list",
          ordered,
          items: [],
        };
      }

      currentList.items.push(item);
      return;
    }

    flushList();
    paragraph.push(trimmed);
  });

  flushParagraph();
  flushList();
  if (codeBlock) blocks.push(codeBlock);

  return blocks;
}

export default function FormattedMessage({ text }) {
  const blocks = parseMarkdown(text || "");

  return (
    <div className="space-y-3 text-[15px] leading-7 text-gray-700">
      {blocks.map((block, index) => {
        if (block.type === "heading") {
          return (
            <h4
              key={index}
              className="pt-1 text-sm font-black uppercase tracking-wide text-violet-700"
            >
              {inlineMarkdown(block.text)}
            </h4>
          );
        }

        if (block.type === "code") {
          return (
            <pre
              key={index}
              className="overflow-x-auto rounded-2xl border border-gray-200 bg-gray-900 p-4 text-sm leading-6 text-gray-100"
            >
              <code>{block.text.trim()}</code>
            </pre>
          );
        }

        if (block.type === "list") {
          const ListTag = block.ordered ? "ol" : "ul";

          return (
            <ListTag
              key={index}
              className={`space-y-2 pl-5 ${
                block.ordered ? "list-decimal" : "list-disc"
              }`}
            >
              {block.items.map((item, itemIndex) => (
                <li key={itemIndex} className="pl-1 marker:text-violet-500">
                  {inlineMarkdown(item)}
                </li>
              ))}
            </ListTag>
          );
        }

        return (
          <p key={index} className="text-gray-700">
            {inlineMarkdown(block.text)}
          </p>
        );
      })}
    </div>
  );
}
