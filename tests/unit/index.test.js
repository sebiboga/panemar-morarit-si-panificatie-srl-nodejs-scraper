import { jest } from "@jest/globals";
import { extractJobsFromCareersPage, mapToJobModel } from "../../index.js";

const COMPANY_CIF = "4844886";
const COMPANY_NAME = "PANEMAR MORARIT SI PANIFICATIE SRL";
const CAREERS_URL = "https://panemar.ro/angajari/";

function createMockCareersPage(options) {
  let html = `<!DOCTYPE html><html><body><form>`;
  html += `<span class="wpcf7-form-control-wrap" data-name="menu-117"><select class="wpcf7-form-control wpcf7-select" aria-invalid="false" name="menu-117">`;

  for (const opt of options) {
    html += `\n<option value="${opt.replace(/"/g, '&quot;')}">${opt}</option>`;
  }

  html += `\n</select></span></form></body></html>`;
  return html;
}

describe("extractJobsFromCareersPage", () => {
  test("extracts all job roles from careers page form", () => {
    const html = createMockCareersPage([
      "Brutar",
      "Patiser",
      "Șofer",
      "Muncitor necalificat"
    ]);

    const jobs = extractJobsFromCareersPage(html);
    expect(jobs).toHaveLength(4);
    expect(jobs[0].title).toBe("Brutar");
    expect(jobs[0].url).toBe(`${CAREERS_URL}#brutar`);
    expect(jobs[1].title).toBe("Patiser");
    expect(jobs[1].url).toBe(`${CAREERS_URL}#patiser`);
    expect(jobs[2].title).toBe("Șofer");
    expect(jobs[2].url).toBe(`${CAREERS_URL}#ofer`);
    expect(jobs[3].title).toBe("Muncitor necalificat");
    expect(jobs[3].url).toBe(`${CAREERS_URL}#muncitor-necalificat`);
  });

  test("returns empty array when no options found", () => {
    const html = "<html><body><form><input type='text'/></form></body></html>";
    const jobs = extractJobsFromCareersPage(html);
    expect(jobs).toEqual([]);
  });

  test("handles single job option", () => {
    const html = createMockCareersPage(["Brutar"]);

    const jobs = extractJobsFromCareersPage(html);
    expect(jobs).toHaveLength(1);
    expect(jobs[0].title).toBe("Brutar");
    expect(jobs[0].url).toBe(`${CAREERS_URL}#brutar`);
  });

  test("deduplicates repeated options", () => {
    const html = createMockCareersPage(["Brutar", "Brutar", "Patiser"]);

    const jobs = extractJobsFromCareersPage(html);
    expect(jobs).toHaveLength(2);
  });
});

describe("mapToJobModel", () => {
  test("maps raw job to correct model with Cluj-Napoca location", () => {
    const rawJob = {
      title: "Brutar",
      url: CAREERS_URL
    };

    const result = mapToJobModel(rawJob, COMPANY_CIF, COMPANY_NAME);

    expect(result).toEqual({
      url: CAREERS_URL,
      title: "Brutar",
      company: COMPANY_NAME,
      cif: COMPANY_CIF,
      location: ["Cluj-Napoca"],
      country: ["România"],
      date: expect.any(String),
      status: "scraped"
    });
  });

  test("creates entries for all job types", () => {
    const jobs = [
      { title: "Brutar", url: CAREERS_URL },
      { title: "Patiser", url: CAREERS_URL },
      { title: "Șofer", url: CAREERS_URL }
    ];

    const results = jobs.map(j => mapToJobModel(j, COMPANY_CIF, COMPANY_NAME));
    expect(results).toHaveLength(3);
    expect(results.map(r => r.title)).toEqual(["Brutar", "Patiser", "Șofer"]);
  });
});
