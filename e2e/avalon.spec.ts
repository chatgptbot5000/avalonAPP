import { expect, test } from "@playwright/test"

test("host creates a room and a second player joins", async ({ browser }) => {
  const hostContext = await browser.newContext()
  const host = await hostContext.newPage()
  await host.goto("/")
  await host.getByLabel(/display name/i).fill("Host")
  await host.getByRole("button", { name: /create room/i }).click()

  await expect(host).toHaveURL(/\/room\/[A-Z0-9]+$/i)

  const roomCode = host.url().match(/\/room\/([A-Z0-9]+)$/i)?.[1]

  expect(roomCode).toBeTruthy()
  await expect(host.getByText(/1 player gathered at the table/i)).toBeVisible()
  await expect(host.getByText(/^host$/i)).toBeVisible()

  const guestContext = await browser.newContext()
  const guest = await guestContext.newPage()
  await guest.goto("/")
  await guest.getByLabel(/display name/i).fill("Guest")
  await guest.getByLabel(/room code/i).fill(roomCode ?? "")
  await guest.getByRole("button", { name: /join room/i }).click()

  await expect(guest).toHaveURL(new RegExp(`/room/${roomCode}$`, "i"))
  await expect(guest.getByText(/^guest$/i)).toBeVisible()

  await expect(host.getByText(/2 players gathered at the table/i)).toBeVisible()
  await expect(host.getByText(/^guest$/i)).toBeVisible()

  await hostContext.close()
  await guestContext.close()
})
