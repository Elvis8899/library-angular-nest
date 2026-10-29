import { escapeHtml, printDocument } from "@app/shared/utils/print.utility";

describe("print.utility", () => {
  it("Should escape text for a page", () => {
    expect(escapeHtml('<a href="x">&</a>')).toBe(
      "&lt;a href=&quot;x&quot;&gt;&amp;&lt;/a&gt;",
    );
    expect(escapeHtml(null)).toBe("");
  });

  it("Should print through a frame removed after", () => {
    const html = "<!doctype html><title>Recibo</title><p>x</p>";
    printDocument(html, document);
    const frame = document.querySelector("iframe")!;
    expect(frame.srcdoc).toBe(html);
    const view = frame.contentWindow!;
    // happy-dom's frames have no print of their own to spy on
    const print = vi.fn();
    view.print = print;
    frame.dispatchEvent(new Event("load"));
    expect(print).toHaveBeenCalled();
    view.dispatchEvent(new Event("afterprint"));
    expect(document.querySelector("iframe")).toBeNull();
  });
});
