import * as cheerio from "cheerio"
import * as fs from "fs"
import * as path from "path"

const SALARIES_DIR = path.join(process.cwd(), "public", "salaries")

async function fetchPage(url: string): Promise<string> {
  const response = await fetch(url, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
    },
  })
  if (!response.ok) {
    throw new Error(`Failed to fetch ${url}: ${response.statusText}`)
  }
  return response.text()
}

function extractTableData(html: string): string {
  const $ = cheerio.load(html)
  const table = $("table").first()

  if (!table.length) {
    throw new Error("No table found in the page")
  }

  const rows: string[] = []
  table.find("tr").each((_, tr) => {
    const cells: string[] = []
    $(tr)
      .find("td, th")
      .each((_, cell) => {
        const text = $(cell).text().trim()
        cells.push(`"${text.replace(/"/g, "")}"`)
      })

    if (cells.length > 0) {
      rows.push(cells.join(","))
    }
  })

  return rows.join("\n")
}

async function scrapeSalaryData() {
  console.log("Creating salaries directory...")
  if (!fs.existsSync(SALARIES_DIR)) {
    fs.mkdirSync(SALARIES_DIR, { recursive: true })
  }

  const urls = [
    {
      url: "https://web3.career/web3-salaries",
      filename: "tech.csv",
    },
    {
      url: "https://web3.career/web3-non-tech-salaries",
      filename: "non-tech.csv",
    },
  ]

  for (const { url, filename } of urls) {
    console.log(`Fetching ${url}...`)
    try {
      const html = await fetchPage(url)
      const csvData = extractTableData(html)

      const outputPath = path.join(SALARIES_DIR, filename)
      fs.writeFileSync(outputPath, csvData, "utf-8")
      console.log(`Saved ${filename}`)
    } catch (error) {
      console.error(`Error processing ${url}:`, error)
    }
  }

  console.log("Done!")
}

scrapeSalaryData().catch(console.error)
