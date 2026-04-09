function getErrorMessage(json: unknown) {
  return typeof json === "object" && json !== null && "error" in json && typeof json.error === "string"
    ? json.error
    : null
}

export async function postJson<T>(url: string, body: unknown) {
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  })

  const json = (await response.json()) as T | { error?: string }

  if (!response.ok) {
    throw new Error(getErrorMessage(json) ?? `Request failed: ${response.status}`)
  }

  return json as T
}
