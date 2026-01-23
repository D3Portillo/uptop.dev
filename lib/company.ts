import useSWR from "swr"

export const useCompanyAppData = (companyName: string) => {
  const { data: companyData = null } = useSWR(
    `company-data-${companyName}`,
    async () => {
      // import company data dynamically based on companyName
      const { COMPANIES } = await import("@/lib/constants/companies")
      type TCompanies = typeof COMPANIES

      const companyData = (COMPANIES as any)[
        companyName.toUpperCase()
      ] as TCompanies[keyof TCompanies]
      return companyData || null
    },
  )

  return {
    companyData,
  }
}
