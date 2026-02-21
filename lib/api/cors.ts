const DEFAULT_METHODS = "GET, POST, OPTIONS"
const STREAM_METHODS = "GET, OPTIONS"

export function corsHeaders(methods: string = DEFAULT_METHODS) {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": methods,
    "Access-Control-Allow-Headers": "Content-Type",
  }
}

export function corsHeadersStream() {
  return corsHeaders(STREAM_METHODS)
}

export function withCors<T>(
  response: NextResponse | Response,
  methods: string = DEFAULT_METHODS
): NextResponse | Response {
  const headers = new Headers(response.headers)
  Object.entries(corsHeaders(methods)).forEach(([k, v]) => headers.set(k, v))
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  })
}
