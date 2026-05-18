import { describe, expect, it } from "vitest";
import { PDFDocument } from "pdf-lib";
import { fillPdfForm, inspectPdfForm, mergePdfPlaceholder } from "../src";

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
