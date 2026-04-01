import { useState, type ReactNode } from "react";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import {
  Bold,
  Italic,
  Link2,
  List,
  ListOrdered,
  Redo2,
  Undo2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type EmailEditorValue = {
  html: string;
  json: Record<string, unknown> | null;
  text: string;
};

interface TiptapEmailEditorProps {
  value: EmailEditorValue;
  onChange: (nextValue: EmailEditorValue) => void;
  labelId?: string;
  descriptionId?: string;
}

function ToolbarButton({
  label,
  isActive = false,
  disabled = false,
  onClick,
  children,
}: {
  label: string;
  isActive?: boolean;
  disabled?: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      aria-pressed={isActive || undefined}
      onClick={onClick}
      disabled={disabled}
      className={`flex h-9 w-9 items-center justify-center rounded-lg border border-dashed transition ${
        isActive
          ? "border-slate-500 bg-slate-100 text-slate-800"
          : "border-slate-300 bg-white text-slate-500 hover:bg-slate-50"
      } focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-300 disabled:cursor-not-allowed disabled:opacity-40`}
    >
      {children}
    </button>
  );
}

export function TiptapEmailEditor({
  value,
  onChange,
  labelId,
  descriptionId,
}: TiptapEmailEditorProps) {
  const [isLinkInputOpen, setIsLinkInputOpen] = useState(false);
  const [linkValue, setLinkValue] = useState("");

  const editor = useEditor({
    immediatelyRender: true,
    extensions: [
      StarterKit.configure({
        heading: false,
        codeBlock: false,
        blockquote: false,
        horizontalRule: false,
      }),
      Link.configure({
        openOnClick: false,
        autolink: true,
        linkOnPaste: true,
        defaultProtocol: "https",
      }),
    ],
    content: value.html || "<p></p>",
    editorProps: {
      attributes: {
        class:
          "min-h-[260px] px-4 py-4 text-sm leading-7 text-slate-700 outline-none",
        role: "textbox",
        "aria-multiline": "true",
        ...(labelId
          ? { "aria-labelledby": labelId }
          : { "aria-label": "Message body editor" }),
        ...(descriptionId ? { "aria-describedby": descriptionId } : {}),
      },
    },
    onUpdate({ editor: activeEditor }) {
      onChange({
        html: activeEditor.getHTML(),
        json: activeEditor.getJSON() as Record<string, unknown>,
        text: activeEditor.getText(),
      });
    },
  });

  const closeLinkInput = () => {
    setIsLinkInputOpen(false);
    setLinkValue("");
  };

  const handleLinkToggle = () => {
    if (!editor) {
      return;
    }

    const existingHref = editor.getAttributes("link").href as string | undefined;
    setLinkValue(existingHref ?? "https://");
    setIsLinkInputOpen(true);
  };

  const handleApplyLink = () => {
    if (!editor) {
      return;
    }

    const nextHref = linkValue.trim();

    if (!nextHref) {
      editor.chain().focus().unsetLink().run();
      closeLinkInput();
      return;
    }

    editor.chain().focus().extendMarkRange("link").setLink({ href: nextHref }).run();
    closeLinkInput();
  };

  return (
    <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50/60">
      <div className="flex flex-wrap items-center gap-2 border-b border-dashed border-slate-300 px-4 py-3">
        <ToolbarButton
          label="Undo"
          disabled={!editor?.can().chain().focus().undo().run()}
          onClick={() => editor?.chain().focus().undo().run()}
        >
          <Undo2 className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          label="Redo"
          disabled={!editor?.can().chain().focus().redo().run()}
          onClick={() => editor?.chain().focus().redo().run()}
        >
          <Redo2 className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          label="Bold"
          isActive={editor?.isActive("bold")}
          onClick={() => editor?.chain().focus().toggleBold().run()}
        >
          <Bold className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          label="Italic"
          isActive={editor?.isActive("italic")}
          onClick={() => editor?.chain().focus().toggleItalic().run()}
        >
          <Italic className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          label="Bullet List"
          isActive={editor?.isActive("bulletList")}
          onClick={() => editor?.chain().focus().toggleBulletList().run()}
        >
          <List className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          label="Ordered List"
          isActive={editor?.isActive("orderedList")}
          onClick={() => editor?.chain().focus().toggleOrderedList().run()}
        >
          <ListOrdered className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          label="Insert Link"
          isActive={editor?.isActive("link")}
          onClick={handleLinkToggle}
        >
          <Link2 className="h-4 w-4" />
        </ToolbarButton>
      </div>

      {isLinkInputOpen ? (
        <div className="flex flex-col gap-2 border-b border-dashed border-slate-300 bg-white/80 px-4 py-3 sm:flex-row sm:items-center">
          <Input
            type="url"
            name="message-link"
            value={linkValue}
            spellCheck={false}
            autoComplete="off"
            aria-label="Link URL"
            placeholder="https://example.com…"
            onChange={(event) => setLinkValue(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                handleApplyLink();
              }

              if (event.key === "Escape") {
                event.preventDefault();
                closeLinkInput();
              }
            }}
            className="h-10 border-dashed bg-white"
          />
          <div className="flex gap-2">
            <Button type="button" size="sm" onClick={handleApplyLink}>
              Apply Link
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={closeLinkInput}
            >
              Cancel
            </Button>
          </div>
        </div>
      ) : null}

      <EditorContent
        editor={editor}
        className="min-h-[260px] [&_.ProseMirror]:min-h-[260px] [&_.ProseMirror_a]:text-[#1a40a8] [&_.ProseMirror_a]:underline [&_.ProseMirror_ul]:list-disc [&_.ProseMirror_ul]:pl-6 [&_.ProseMirror_ol]:list-decimal [&_.ProseMirror_ol]:pl-6 [&_.ProseMirror_p.is-editor-empty:first-child::before]:pointer-events-none"
      />
    </div>
  );
}
