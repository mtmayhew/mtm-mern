import React, { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import "./style.css";
import Admin from "./Admin.jsx";
import QuoteForm from "./QuoteForm.jsx";
const services = [
  {
    title: "3D Printing",
    color: "blue",
    icon: "⬡",
    description:
      "Custom keepsakes, collectibles, prototypes, and functional parts—made for your needs.",
    items: [
      "Custom prints & gifts",
      "Functional parts & prototypes",
      "Models & collectibles",
    ],
    cta: "Request a print quote",
    href: "#quote",
  },
  {
    title: "Software Development",
    color: "purple",
    icon: "</>",
    description:
      "Purpose-built applications, APIs, integrations, and automation that solve real problems.",
    items: [
      "Custom applications",
      "API & backend development",
      "Workflow automation",
    ],
    cta: "Discuss your software project",
    href: "#contact",
  },
  {
    title: "Website Design",
    color: "teal",
    icon: "▣",
    description:
      "Modern, responsive websites and web experiences tailored to your brand and goals.",
    items: [
      "Business websites",
      "Responsive design",
      "Website updates & maintenance",
    ],
    cta: "Start your website",
    href: "#contact",
  },
  {
    title: "Tutoring",
    color: "gold",
    icon: "✧",
    description:
      "One-on-one programming and software development guidance at your pace.",
    items: [
      "Programming fundamentals",
      "Project-based coaching",
      "Technical skill development",
    ],
    cta: "Ask about tutoring",
    href: "#contact",
  },
];
function App() {
  const [gallery, setGallery] = useState([]),
    [index, setIndex] = useState(null),
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
      <header className="site-header">
        <div className="container site-nav">
          <a className="brand" href="#home" aria-label="MTM Enterprises home">
            <img
              src="/mtm-logo-wide.webp"
              alt="MTM Enterprises — Design. Develop. Create. Learn."
            />
          </a>
          <nav aria-label="Main navigation">
            <a href="#home">Home</a>
            <a href="#services">Services</a>
            <a href="#gallery">Portfolio</a>
            <a href="#about">About</a>
            <a href="#contact">Contact</a>
          </nav>
          <a href="#contact" className="btn nav-cta">
            Request a Quote <span aria-hidden="true">↗</span>
          </a>
        </div>
      </header>
      <main id="home">
        <section className="hero">
          <div className="container hero-layout">
            <div className="hero-copy">
              <div className="eyebrow">
                <span className="eyebrow-line" /> MTM ENTERPRISES
              </div>
              <h1>
                Design. <span className="accent-purple">Develop.</span>
                <br />
                <span className="accent-blue">Create.</span>{" "}
                <span className="accent-gold">Learn.</span>
              </h1>
              <p className="hero-lead">
                Creative technology solutions for individuals, students, and
                businesses.
              </p>
              <p className="tagline">
                From custom 3D printing and software development to modern
                website design and personalized tutoring, we help bring your
                ideas to reality.
              </p>
              <div className="hero-actions">
                <a href="#services" className="btn">
                  Explore our services <span aria-hidden="true">→</span>
                </a>
                <a href="#contact" className="btn btn-ghost">
                  Get in Touch <span aria-hidden="true">↗</span>
                </a>
              </div>
              <div className="hero-points">
                <span>✦ Innovative solutions</span>
                <span>✦ Tailored to your goals</span>
                <span>✦ Quality & creativity</span>
              </div>
            </div>
            <div
              className="hero-art"
              role="img"
              aria-label="Illustrated studio with a blue 3D-printed dragon, software development workstation, website design screen, and programming books"
            >
              <img src="/mtm-hero-studio.jpg" alt="" />
              <span className="hero-art-shade" />
            </div>
          </div>
        </section>
        <section className="services-section" id="services">
          <div className="container">
            <div className="section-heading">
              <div>
                <span className="section-kicker">WHAT WE DO</span>
                <h2>
                  Four services. <span>One creative partner.</span>
                </h2>
              </div>
              <p>
                From the physical to the digital—and the skills to create
                both—MTM Enterprises offers practical, personalized solutions.
              </p>
            </div>
            <div className="services">
              {services.map((service, i) => (
                <article
                  className={"card service-" + service.color}
                  key={service.title}
                >
                  <span className="service-number">0{i + 1}</span>
                  <div className="service-icon" aria-hidden="true">
                    {service.icon}
                  </div>
                  <h3>{service.title}</h3>
                  <p>{service.description}</p>
                  <ul>
                    {service.items.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                  <a href={service.href}>
                    {service.cta} <span aria-hidden="true">→</span>
                  </a>
                </article>
              ))}
            </div>
          </div>
        </section>
        <section className="gallery" id="gallery">
          <div className="container">
            <div className="gallery-heading">
              <div>
                <span className="gallery-eyebrow">OUR PORTFOLIO</span>
                <h2>
                  Featured <span className="blue-word">Work</span>
                </h2>
                <p>
                  Explore custom prints, applications, websites, and creative
                  work from MTM Enterprises.
                </p>
              </div>
              <span className="gallery-count">{gallery.length} projects</span>
            </div>
            {gallery.length ? (
              <div className="project-grid">
                {gallery.map((item, i) => (
                  <button
                    type="button"
                    key={item.id || item.url}
                    className="project-card"
                    onClick={() => setIndex(i)}
                    aria-label={"View " + (item.title || item.caption)}
                  >
                    <span className="project-image">
                      <img
                        src={item.url}
                        alt={item.title || item.caption}
                        loading="lazy"
                      />
                    </span>
                    <span className="project-info">
                      <span className="project-category">
                        {item.category || "3D Printing"}
                      </span>
                      <strong>{item.title || item.caption}</strong>
                      {item.description && (
                        <span className="project-description">
                          {item.description}
                        </span>
                      )}
                    </span>
                  </button>
                ))}
              </div>
            ) : (
              <p className="gallery-empty">Projects coming soon.</p>
            )}
            {index !== null && gallery[index] && (
              <div
                className="lightbox"
                role="presentation"
                onMouseDown={(e) => {
                  if (e.target === e.currentTarget) setIndex(null);
                }}
              >
                <div
                  className="lightbox-dialog"
                  role="dialog"
                  aria-modal="true"
                  aria-label="Project photo"
                >
                  <button
                    className="lightbox-close"
                    onClick={() => setIndex(null)}
                    aria-label="Close photo"
                  >
                    ×
                  </button>
                  <img
                    src={gallery[index].url}
                    alt={gallery[index].title || gallery[index].caption}
                  />
                  <div className="lightbox-footer">
                    <button
                      onClick={() =>
                        setIndex((index - 1 + gallery.length) % gallery.length)
                      }
                      aria-label="Previous photo"
                    >
                      ←
                    </button>
                    <div>
                      <strong>
                        {gallery[index].title || gallery[index].caption}
                      </strong>
                      <p>{gallery[index].description || ""}</p>
                      <small>
                        {index + 1} / {gallery.length}
                      </small>
                    </div>
                    <button
                      onClick={() => setIndex((index + 1) % gallery.length)}
                      aria-label="Next photo"
                    >
                      →
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </section>
        <QuoteForm />
        <section className="about" id="about">
          <div className="container">
            <h2>About MTM Enterprises</h2>
            <p>
              MTM Enterprises brings together technology, creativity, and
              education. From one-of-a-kind 3D prints and modern websites to
              custom software and individualized tutoring, we help people turn
              ideas into practical results.
            </p>
            <p>
              With extensive software engineering and teaching experience, we
              offer direct communication, thoughtful design, and solutions
              tailored to your goals.
            </p>
          </div>
        </section>
        <section id="contact" className="contact">
          <div className="container">
            <h2>Have an idea? Let’s make it happen.</h2>
            <p className="contact-intro">
              A print, a website, custom software, or help learning to code—we’d
              love to hear what you have in mind.
            </p>
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
        <footer>
          <div className="container footer-inner">
            <span className="footer-brand">
              <img src="/mtm-mark.webp" alt="" aria-hidden="true" /> © 2026 MTM
              Enterprises · Design. Develop. Create. Learn.
            </span>
            <a href="#home">Back to top ↑</a>
          </div>
        </footer>
      </main>
    </>
  );
}
createRoot(document.getElementById("root")).render(
  window.location.pathname.replace(/\/$/, "") === "/admin" ? (
    <Admin />
  ) : (
    <App />
  ),
);
