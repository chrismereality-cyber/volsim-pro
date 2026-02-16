export async function GET() {
  const token = process.env.DERIV_TOKEN;

  if (!token) {
    return Response.json({
      system: "Volsim-Pro",
      connection: "NO_TOKEN",
      security: "SAFE",
      account: "DISCONNECTED"
    });
  }

  return Response.json({
    system: "Volsim-Pro",
    connection: "TOKEN_ACTIVE",
    security: "ENV_TOKEN_ONLY",
    account: "READY",
    time: new Date().toLocaleTimeString()
  });
}
