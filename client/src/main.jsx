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
            <a href="/about">About</a>
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
        <section className="about about-preview" id="about">
          <div className="container founder-preview">
            <div className="founder-preview-photo">
              <img
                src="/michael-headshot.webp"
                alt="Michael Mayhew, founder of MTM Enterprises"
                loading="lazy"
              />
            </div>
            <div className="founder-preview-copy">
              <span className="section-kicker">THE PERSON BEHIND MTM</span>
              <h2>
                Hi, I'm <span>Michael.</span>
              </h2>
              <p>
                I'm a software engineer, educator, and creator who loves
                figuring out how things work—and helping people bring their
                ideas to life.
              </p>
              <p>
                From writing software and teaching programming to designing
                custom 3D prints, MTM Enterprises is where my passions come
                together.
              </p>
              <a href="/about" className="btn">
                Get to know me <span aria-hidden="true">→</span>
              </a>
            </div>
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
function AboutPage() {
  return (
    <>
      <header className="site-header">
        <div className="container site-nav">
          <a className="brand" href="/" aria-label="MTM Enterprises home">
            <img src="/mtm-logo-wide.webp" alt="MTM Enterprises" />
          </a>
          <nav aria-label="Main navigation">
            <a href="/">Home</a>
            <a href="/#services">Services</a>
            <a href="/#gallery">Portfolio</a>
            <a href="/about" aria-current="page">
              About
            </a>
            <a href="/#contact">Contact</a>
          </nav>
          <a href="/#contact" className="btn nav-cta">
            Get in Touch <span aria-hidden="true">↗</span>
          </a>
        </div>
      </header>
      <main className="about-page">
        <section className="about-page-hero">
          <div className="container about-hero-grid">
            <div className="about-hero-copy">
              <span className="section-kicker">MEET THE FOUNDER</span>
              <h1>
                Hi, I'm <span>Michael Mayhew.</span>
              </h1>
              <p className="about-subtitle">
                Developer. Creator. Educator. Problem Solver.
              </p>
              <p>
                I'm the person behind MTM Enterprises, and if there's one thing
                you should know about me, it's that I've always enjoyed figuring
                out how things work—and finding ways to make them work better.
              </p>
              <p>
                I've spent nearly 15 years building software, solving
                challenging technical problems, and turning ideas into working
                solutions. For me, technology has never been just about writing
                code. It's about creating something useful, solving a problem,
                or bringing someone's vision to life.
              </p>
              <a className="btn" href="/#contact">
                Let's talk about your idea <span aria-hidden="true">→</span>
              </a>
            </div>
            <div className="about-portrait-frame">
              <img
                src="/michael-headshot.webp"
                alt="Michael Mayhew smiling in a black shirt against a blue technology-studio background"
              />
              <span className="portrait-caption">
                Michael Mayhew <small>Founder, MTM Enterprises</small>
              </span>
            </div>
          </div>
        </section>
        <section className="about-story">
          <div className="container about-story-layout">
            <div className="about-story-intro">
              <span className="section-kicker">A LITTLE ABOUT MY JOURNEY</span>
              <h2>Curiosity led me here.</h2>
              <p>
                Technology is always changing. What keeps me interested is the
                chance to keep learning, solve new problems, and make a real
                difference for someone.
              </p>
            </div>
            <div className="about-story-sections">
              <article>
                <span className="about-chapter">01 / MY JOURNEY</span>
                <h3>From learning to teaching</h3>
                <p>
                  My interest in technology led me into software engineering,
                  where I've had the opportunity to work with a wide range of
                  technologies, projects, and people. Along the way, I earned my
                  Master's degree in Information Assurance and Security from
                  Norwich University.
                </p>
                <p>
                  I also had the opportunity to teach programming at SUNY
                  Polytechnic Institute. There's something rewarding about
                  helping someone understand a concept they've been struggling
                  with and watching everything finally click. That experience is
                  a big part of why I offer tutoring today.
                </p>
              </article>
              <article>
                <span className="about-chapter">02 / BEYOND THE CODE</span>
                <h3>I love making things real</h3>
                <p>
                  As much as I enjoy software development, I also love creating
                  things I can actually hold. That's where 3D printing comes in.
                </p>
                <p>
                  There's something exciting about taking an idea, creating or
                  adapting a design, and watching it become a physical object.
                  Whether it's a personalized gift, a decorative piece, or
                  something practical, I enjoy the creativity and
                  problem-solving involved in every project.
                </p>
                <p>
                  Software development and 3D printing have a lot in common:
                  they both start with an idea and end with something that
                  didn't exist before.
                </p>
              </article>
              <article>
                <span className="about-chapter">03 / WHY MTM ENTERPRISES</span>
                <h3>Keeping the work personal</h3>
                <p>
                  I started MTM Enterprises because I wanted a way to bring
                  together the things I'm passionate about: technology,
                  creativity, and helping people.
                </p>
                <p>
                  I wanted to create a business where someone could come to me
                  with an idea—whether it's a website, an application, a custom
                  3D print, or simply wanting to learn something new—and we
                  could figure out how to make it happen.
                </p>
                <p>
                  When you work with MTM Enterprises, you're working directly
                  with someone who cares about understanding your project and
                  getting the details right.
                </p>
              </article>
            </div>
          </div>
        </section>
        <section className="about-cta">
          <div className="container">
            <span className="section-kicker">LET'S CREATE SOMETHING</span>
            <h2>
              Have an idea? <span>I'd love to hear it.</span>
            </h2>
            <p>
              Whether you're starting a business, looking for a custom creation,
              solving a technical problem, or taking your first steps into
              programming, no idea is too small to start a conversation.
            </p>
            <a className="btn" href="/#contact">
              Get in Touch <span aria-hidden="true">→</span>
            </a>
            <p className="about-motto">Design. Develop. Create. Learn.</p>
          </div>
        </section>
      </main>
      <footer>
        <div className="container footer-inner">
          <span className="footer-brand">
            <img src="/mtm-mark.webp" alt="" /> © 2026 MTM Enterprises · Design.
            Develop. Create. Learn.
          </span>
          <a href="/">Back to home ↑</a>
        </div>
      </footer>
    </>
  );
}
const currentPath = window.location.pathname.replace(/\/$/, "") || "/";
createRoot(document.getElementById("root")).render(
  currentPath === "/admin" ? (
    <Admin />
  ) : currentPath === "/about" ? (
    <AboutPage />
  ) : (
    <App />
  ),
);
