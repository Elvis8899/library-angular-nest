import { textOf } from "@app/shared/utils/text.utility";

/** Text made safe inside an HTML page's text or attributes. */
export const escapeHtml = (text: unknown): string =>
  textOf(text)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

/**
 * Prints a page through a hidden frame, once its images loaded, and
 * removes the frame after.
 */
export const printDocument = (html: string, document: Document): void => {
  const frame = document.createElement("iframe");
  frame.setAttribute("aria-hidden", "true");
  frame.style.cssText =
    "position:fixed;right:0;bottom:0;width:0;height:0;border:0";
  frame.srcdoc = html;
  frame.addEventListener(
    "load",
    () => {
      const view = frame.contentWindow;
      view?.addEventListener("afterprint", () => frame.remove(), {
        once: true,
      });
      view?.focus();
      view?.print();
    },
    { once: true },
  );
  document.body.appendChild(frame);
};
