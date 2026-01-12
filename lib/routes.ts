export const staledResponse = (
  data: any,
  opts: { statusCode?: number; timeInSeconds: number }
) => {
  // Format stale-while-revalidate time, min 60 seconds
  const swrTime = Math.min(60, Math.round(opts.timeInSeconds))
  return Response.json(data, {
    headers: {
      "Cache-Control": `public, max-age=${swrTime}, s-maxage=${swrTime}, stale-while-revalidate=${swrTime}`,
    },
    status: opts?.statusCode ?? 200,
  })
}
