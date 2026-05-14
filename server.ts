import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import { Resend } from "resend";
import dotenv from "dotenv";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Routes
  app.post("/api/notify-admin", async (req, res) => {
    const { orderEmail, orderId, total, userDetails, items, receiptNote } = req.body;
    
    const RESEND_API_KEY = process.env.RESEND_API_KEY;
    if (!RESEND_API_KEY) {
      console.warn("RESEND_API_KEY not found. Skipping email notification.");
      return res.json({ success: false, message: "Email service not configured" });
    }

    const resend = new Resend(RESEND_API_KEY);

    try {
      const { data, error } = await resend.emails.send({
        from: "Haloa Orders <notifications@resend.dev>",
        to: ["amizhkeeran@gmail.com"],
        subject: `New Receipt Uploaded - Order #${orderId.slice(0, 8)}`,
        html: `
          <div style="font-family: serif; padding: 20px; color: #064e3b; background-color: #f8faf9;">
            <h1 style="border-bottom: 1px solid #064e3b; padding-bottom: 10px;">New Payment Receipt Received</h1>
            <p><strong>Order ID:</strong> ${orderId}</p>
            <p><strong>Total:</strong> LKR ${total.toLocaleString()}</p>
            
            <div style="margin: 20px 0; padding: 15px; border: 1px solid #064e3b;">
              <h2 style="font-size: 1.2em;">User Details</h2>
              <p>Name: ${userDetails.name}</p>
              <p>Phone: ${userDetails.phone}</p>
              <p>Address: ${userDetails.address}</p>
              <p>User Email: ${orderEmail}</p>
            </div>

            <div style="margin: 20px 0; padding: 15px; background: #fff;">
              <h2 style="font-size: 1.2em;">Receipt Info</h2>
              <p><strong>Reference/Link:</strong> ${receiptNote}</p>
            </div>

            <div style="margin: 20px 0;">
              <h2 style="font-size: 1.2em;">Ordered Items</h2>
              <ul>
                ${items.map((item: any) => `<li>${item.name} (${item.size}) x ${item.quantity} - LKR ${(item.price * item.quantity).toLocaleString()}</li>`).join('')}
              </ul>
            </div>
            
            <p style="font-size: 0.8em; color: #a1a1aa; margin-top: 40px;">Haloa Artisanal Nutrition Delivery System</p>
          </div>
        `,
      });

      if (error) {
        console.error("Resend error:", error);
        return res.status(500).json({ success: false, error });
      }

      res.json({ success: true, data });
    } catch (err) {
      console.error("Failed to send email:", err);
      res.status(500).json({ success: false, error: err });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
