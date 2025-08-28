// @ts-nocheck
import { serve, ServerRequest } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY")

interface Property {
  id: string;
  title: string;
  price: number;
  currency: string;
}

interface User {
  full_name?: string;
  email: string;
}

interface RequestBody {
  user: User;
  properties: Property[];
}


serve(async (req: ServerRequest) => {
  if (req.method !== "POST") {
    return new Response("Method Not Allowed", { status: 405 })
  }

  try {
    const { user, properties }: RequestBody = await req.json()

    if (!user || !properties || properties.length === 0) {
      return new Response("Missing user or properties", { status: 400 })
    }

    const emailHtml = `
      <h1>Nouvelles propriétés correspondant à vos critères</h1>
      <p>Bonjour ${user.full_name || "cher utilisateur"},</p>
      <p>De nouveaux biens correspondant à votre recherche sauvegardée sont disponibles :</p>
      <ul>
        ${properties
          .map(
            (prop: Property) => `
          <li>
            <a href="https://lvcgrmvvbinnbtreurnn/biens/${prop.id}">
              ${prop.title} - ${prop.price} ${prop.currency}
            </a>
          </li>
        `
          )
          .join("")}
      </ul>
    `

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "onboarding@resend.dev",
        to: user.email,
        subject: "Alerte : Nouveaux biens disponibles",
        html: emailHtml,
      }),
    })

    if (!res.ok) {
      const error = await res.json()
      console.error("Failed to send email:", error)
      return new Response(JSON.stringify(error), { status: 500 })
    }

    return new Response(JSON.stringify({ message: "Email sent successfully" }), {
      status: 200,
    })
  } catch (error) {
    console.error("Error processing request:", error)
    return new Response("Internal Server Error", { status: 500 })
  }
})
