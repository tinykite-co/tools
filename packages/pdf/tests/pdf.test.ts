import { describe, expect, it } from "vitest";
import { PDFDocument } from "pdf-lib";
import { fillPdfForm, inspectPdfForm, mergePdfPlaceholder, imagesToPdfPlaceholder, imagesToPdf } from "../src";

async function createEditablePdf() {
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([500, 500]);
  const form = pdfDoc.getForm();

  const name = form.createTextField("person.fullName");
  name.addToPage(page, { x: 50, y: 400, width: 220, height: 24 });

  const acceptsTerms = form.createCheckBox("termsAccepted");
  acceptsTerms.addToPage(page, { x: 50, y: 350, width: 16, height: 16 });

  const country = form.createDropdown("country");
  country.addOptions(["United Kingdom", "United States"]);
  country.addToPage(page, { x: 50, y: 300, width: 180, height: 24 });

  return await pdfDoc.save();
}

async function createFlatPdf() {
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([500, 500]);
  page.drawText("Flat application form", { x: 50, y: 430, size: 18 });
  page.drawText("Name:", { x: 50, y: 380, size: 12 });
  return await pdfDoc.save();
}

describe("pdf", () => {
  it("returns a placeholder message", () => {
    expect(mergePdfPlaceholder()).toContain("placeholder");
  });

  it("inspects editable PDF form fields", async () => {
    const pdf = await createEditablePdf();

    const result = await inspectPdfForm({
      pdf: { data: pdf, filename: "application.pdf" }
    });

    expect(result.fileName).toBe("application.pdf");
    expect(result.fieldCount).toBe(3);
    expect(result.fields.map((field) => field.name)).toEqual([
      "person.fullName",
      "termsAccepted",
      "country"
    ]);
    expect(result.fields.find((field) => field.name === "country")?.options).toEqual([
      "United Kingdom",
      "United States"
    ]);
  });

  it("fills editable PDF form fields and returns a downloadable asset", async () => {
    const pdf = await createEditablePdf();

    const result = await fillPdfForm({
      pdf: { data: pdf, filename: "application.pdf" },
      values: {
        "person.fullName": "Ada Lovelace",
        termsAccepted: true,
        country: "United States"
      }
    });

    expect(result.output.fileName).toBe("application-filled.pdf");
    expect(result.output.filledCount).toBe(3);
    expect(result.assets).toHaveLength(1);
    expect(result.assets[0]?.mimeType).toBe("application/pdf");

    const filled = await PDFDocument.load(result.assets[0]!.data as Uint8Array);
    const form = filled.getForm();

    expect(form.getTextField("person.fullName").getText()).toBe("Ada Lovelace");
    expect(form.getCheckBox("termsAccepted").isChecked()).toBe(true);
    expect(form.getDropdown("country").getSelected()).toEqual(["United States"]);
  });

  it("draws manual text overlays onto flat PDFs", async () => {
    const pdf = await createFlatPdf();

    const result = await fillPdfForm({
      pdf: { data: pdf, filename: "flat.pdf" },
      values: {},
      textOverlays: [
        {
          id: "name",
          pageIndex: 0,
          x: 0.22,
          y: 0.24,
          text: "Ada Lovelace",
          fontSize: 12
        }
      ]
    });

    expect(result.output.fileName).toBe("flat-filled.pdf");
    expect(result.output.fieldCount).toBe(0);
    expect(result.output.textOverlayCount).toBe(1);
    expect(result.assets).toHaveLength(1);
    expect(result.assets[0]?.sizeBytes).toBeGreaterThan(pdf.byteLength);
  });
});

const TINY_PNG = new Uint8Array([
  137, 80, 78, 71, 13, 10, 26, 10, 0, 0, 0, 13, 73, 72, 68, 82, 0, 0, 0, 1, 0, 0, 0, 1, 8, 6, 0, 0, 0, 31, 21, 196,
  137, 0, 0, 0, 13, 73, 68, 65, 84, 120, 218, 99, 252, 207, 192, 240, 31, 0, 5, 5, 2, 0, 95, 200, 241, 210, 0, 0,
  0, 0, 73, 69, 78, 68, 174, 66, 96, 130
]);

describe("imagesToPdf", () => {
  it("returns a placeholder message", () => {
    expect(imagesToPdfPlaceholder({ images: [] })).toContain("placeholder");
    expect(imagesToPdfPlaceholder({ images: [TINY_PNG] })).toContain("1 image");
  });

  it("creates a PDF with one page from a PNG", async () => {
    const pdfBytes = await imagesToPdf({ images: [TINY_PNG] });
    expect(pdfBytes).toBeInstanceOf(Uint8Array);
    expect(pdfBytes.length).toBeGreaterThan(100);

    const loaded = await PDFDocument.load(pdfBytes);
    expect(loaded.getPageCount()).toBe(1);
    const page = loaded.getPages()[0];
    // 1x1 image at 72dpi -> page is 1x1
    expect(page.getSize().width).toBe(1);
    expect(page.getSize().height).toBe(1);
  });

  it("creates a multi-page PDF from multiple images", async () => {
    const pdfBytes = await imagesToPdf({ images: [TINY_PNG, TINY_PNG] });
    const loaded = await PDFDocument.load(pdfBytes);
    expect(loaded.getPageCount()).toBe(2);
  });
});
