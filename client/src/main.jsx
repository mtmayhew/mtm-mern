import React, { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import "./style.css";
const services = [
  [
    "3D Printing & Design",
    [
      "Personalized Keepsakes",
      "Family & Memorial Gifts",
      "Gaming & Fantasy Items",
      "Cosplay Props",
      "Home Décor",
      "Custom 3D Designs",
    ],
  ],
  [
    "Software Development",
    [
      "Custom Applications",
      "Enterprise Software",
      "API Development",
      "Cloud Solutions",
      "Database Design",
      "System Integration",
    ],
  ],
  [
    "Web Development",
    [
      "Business Websites",
      "E-Commerce Stores",
      "Web Applications",
      "Responsive Design",
      "SEO Optimization",
      "Website Maintenance",
    ],
  ],
];
function App() {
  const [gallery, setGallery] = useState([]),
    [index, setIndex] = useState(0),
    [form, setForm] = useState({ name: "", email: "", message: "" }),
    [status, setStatus] = useState(""),
    [busy, setBusy] = useState(false);
  useEffect(() => {
    fetch("/api/gallery")
      .then((r) => {
        if (!r.ok) throw new Error("Gallery unavailable");
        return r.json();
      })
      .then(setGallery)
      .catch(() => setGallery([]));
  }, []);
  const change = (key) => (e) => setForm({ ...form, [key]: e.target.value });
  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setStatus("");
    try {
      let r = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      let j = await r.json();
      if (!r.ok) throw new Error(j.error || "Could not send inquiry");
      setStatus("Thanks! Your inquiry has been received.");
      setForm({ name: "", email: "", message: "" });
    } catch (err) {
      setStatus(err.message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <section className="hero">
        <div className="hero-content">
          <h1>MTM Enterprisess</h1>
          <p className="tagline">
            Custom 3D Printing, Software Development, Web Solutions & Digital
            Design
          </p>
          <a href="#contact" className="btn">
            Get In Touch
          </a>
        </div>
      </section>
      <section>
        <div className="container">
          <h2>What We Do</h2>
          <div className="services">
            {services.map(([title, items]) => (
              <div className="card" key={title}>
                <h3>{title}</h3>
                <ul>
                  {items.map((item) => (
                    <li key={item}>✓ {item}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>
      <section className="gallery">
        <div className="container">
          <h2>Recent Projects</h2>
          {gallery.length ? (
            <>
              <div className="carousel-container">
                <button
                  className="nav prev"
                  aria-label="Previous image"
                  onClick={() =>
                    setIndex((index - 1 + gallery.length) % gallery.length)
                  }
                >
                  ❮
                </button>
                <img src={gallery[index].url} alt={gallery[index].caption} />
                <button
                  className="nav next"
                  aria-label="Next image"
                  onClick={() => setIndex((index + 1) % gallery.length)}
                >
                  ❯
                </button>
              </div>
              <p className="caption">{gallery[index].caption}</p>
            </>
          ) : (
            <p className="caption">No gallery images available.</p>
          )}
        </div>
      </section>
      <section className="about">
        <div className="container">
          <h2>About MTM Enterprises</h2>
          <p>
            MTM Enterprises combines creativity, engineering, and technology to
            bring ideas to life. Whether you need a custom 3D printed keepsake,
            a professional website, a business application, or a complete
            digital solution, we provide personalized service and high-quality
            results.
          </p>
          <p>
            Led by Michael Mayhew, a software developer with nearly 15 years of
            experience in application development, backend services, frontend
            engineering, and technical education, MTM Enterprises helps clients
            transform concepts into reality.
          </p>
        </div>
      </section>
      <section id="contact" className="contact">
        <div className="container">
          <h2>Contact Us</h2>
          <p>
            <strong>Michael Mayhew</strong>
          </p>
          <p>📞 315-225-0010</p>
          <p>
            ✉ <a href="mailto:mtmayhew@mtm-ent.org">mtmayhew@mtm-ent.org</a>
          </p>
          <p>
            🌐 <a href="https://mtm-ent.org">mtm-ent.org</a>
          </p>
          <form onSubmit={submit} className="contact-form">
            <h3>Send an inquiry</h3>
            <input
              required
              maxLength="100"
              placeholder="Your name"
              value={form.name}
              onChange={change("name")}
            />
            <input
              required
              type="email"
              maxLength="254"
              placeholder="Email address"
              value={form.email}
              onChange={change("email")}
            />
            <textarea
              required
              maxLength="4000"
              rows="5"
              placeholder="Tell us about your project"
              value={form.message}
              onChange={change("message")}
            />
            <button className="btn" disabled={busy}>
              {busy ? "Sending…" : "Send inquiry"}
            </button>
            <p role="status">{status}</p>
          </form>
        </div>
      </section>
      <footer>© 2026 MTM Enterprises | Design • Development • Creation</footer>
    </>
  );
}
createRoot(document.getElementById("root")).render(<App />);
