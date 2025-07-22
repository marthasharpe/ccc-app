export default function AboutPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="prose prose-slate max-w-none">
          {/* Table of Contents */}
          <h2 className="text-2xl font-bold mb-6">Table of Contents</h2>
          <ul className="space-y-3 mb-6 text-lg">
            <li className="flex items-start">
              <span className="text-primary mr-3">•</span>
              <a
                href="#what-is-catechism"
                className="text-primary hover:text-primary/80 transition-colors"
              >
                What is the Catechism?
              </a>
            </li>
            <li className="flex items-start">
              <span className="text-primary mr-3">•</span>
              <a
                href="#four-pillars"
                className="text-primary hover:text-primary/80 transition-colors"
              >
                Structure of the Catechism: The Four Pillars
              </a>
            </li>
            <li className="flex items-start">
              <span className="text-primary mr-3">•</span>
              <a
                href="#who-is-it-for"
                className="text-primary hover:text-primary/80 transition-colors"
              >
                Who Is It For?
              </a>
            </li>
            <li className="flex items-start">
              <span className="text-primary mr-3">•</span>
              <a
                href="#interactive-catechism"
                className="text-primary hover:text-primary/80 transition-colors"
              >
                Why an Interactive Catechism?
              </a>
            </li>
            <li className="flex items-start">
              <span className="text-primary mr-3">•</span>
              <a
                href="#support"
                className="text-primary hover:text-primary/80 transition-colors"
              >
                Support Truth Me Up
              </a>
            </li>
          </ul>
          <div className="border-t border-muted my-8"></div>

          {/* Main Content */}

          <h2 id="what-is-catechism" className="text-2xl font-bold mb-6">
            What is the Catechism?
          </h2>
          <p className="text-lg leading-relaxed mb-6">
            The{" "}
            <a
              href="https://www.vatican.va/archive/ENG0015/_INDEX.HTM"
              target="_blank"
              rel="noopener noreferrer"
              className="items-center justify-center font-medium ring-offset-background transition-all cursor-pointer text-primary hover:text-primary/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              Catechism of the Catholic Church (CCC)
            </a>{" "}
            is a book that summarizes the essential teachings of the Catholic
            faith. It was first published in 1992 under Pope John Paul II to
            serve as a clear and comprehensive guide to what the Church believes
            and teaches around the world.
          </p>

          <p className="text-lg leading-relaxed">
            The Catechism doesn&apos;t introduce new doctrine—it organizes and
            explains the faith the Church has always professed. It draws from
            Scripture, Tradition, and the Magisterium (the Church&apos;s
            teaching authority), and it quotes heavily from the Bible, the early
            Church Fathers, saints, councils, and other Church documents.
          </p>

          <div className="border-t border-muted my-8"></div>

          <h2 id="four-pillars" className="text-2xl font-bold mb-6">
            Structure of the Catechism: The Four Pillars
          </h2>

          <p className="text-lg mb-6">
            The Catechism is divided into four main parts, often called the
            &ldquo;four pillars&rdquo; of the faith:
          </p>

          <div className="space-y-6">
            <div className="border-l-4 border-primary pl-6">
              <h3 className="text-xl font-semibold mb-2">
                1. The Creed — What the Church believes
              </h3>
              <p className="">
                Apostles&apos; Creed and Nicene Creed, with explanations of each
                article of faith
              </p>
            </div>

            <div className="border-l-4 border-primary pl-6">
              <h3 className="text-xl font-semibold mb-2">
                2. The Sacraments — How the Church celebrates the faith
              </h3>
              <p className="">
                Baptism, Eucharist, Confirmation, etc.; how God shares His life
                with us
              </p>
            </div>

            <div className="border-l-4 border-primary pl-6">
              <h3 className="text-xl font-semibold mb-2">
                3. The Commandments — How the Church lives the faith
              </h3>
              <p className="">
                A moral guide based on the Ten Commandments, including
                conscience, virtue, and social teaching
              </p>
            </div>

            <div className="border-l-4 border-primary pl-6">
              <h3 className="text-xl font-semibold mb-2">
                4. Prayer — How the Church speaks with God
              </h3>
              <p className="">
                Especially the Our Father, as a model of all Christian prayer
              </p>
            </div>
          </div>

          <div className="border-t border-muted my-8"></div>

          <h2 id="who-is-it-for" className="text-2xl font-bold mb-6">
            Who Is It For?
          </h2>

          <p className="text-lg mb-6">
            The Catechism is not just for theologians or priests. It is written
            for everyone who wants to know what the Catholic Church teaches and
            why. Whether you&apos;re Catholic or just curious, it can help you:
          </p>

          <ul className="space-y-3 mb-6 text-lg">
            <li className="flex items-start">
              <span className="text-primary mr-3">•</span>
              <span>Understand the meaning and coherence of the faith</span>
            </li>
            <li className="flex items-start">
              <span className="text-primary mr-3">•</span>
              <span>
                See how the Church&apos;s teachings are rooted in Scripture and
                Tradition
              </span>
            </li>
            <li className="flex items-start">
              <span className="text-primary mr-3">•</span>
              <span>
                Find clear answers to difficult or confusing questions
              </span>
            </li>
            <li className="flex items-start">
              <span className="text-primary mr-3">•</span>
              <span>Deepen your relationship with God and the Church</span>
            </li>
          </ul>

          <p className="text-lg">
            It&apos;s a resource for learning, teaching, and growing in faith.
            You don&apos;t have to read it all at once—you can explore one
            question, topic, or paragraph at a time.
          </p>

          <div className="border-t border-muted my-8"></div>
          <h2 id="interactive-catechism" className="text-2xl font-bold mb-6">
            Why an Interactive Catechism?
          </h2>
          <p className="text-lg leading-relaxed mb-6">
            Sometimes finding out what the Catholic Church actually teaches can
            be difficult. Church documents can be challenging to navigate or
            apply to specific questions. Asking other Catholics is not always
            helpful, as they may not know the answer or give their own
            interpretation rather than the Church&apos;s official teaching.
          </p>
          <p className="text-lg leading-relaxed mb-6">
            <strong>Truth Me Up</strong> strives to bridge this gap by using the
            latest AI technology (GPT‑4.0) to provide clear, trustworthy answers
            based only on official Church sources - the Catechism and other
            approved magisterial documents. Each answer includes direct links to
            the relevant Catechism passages for further study.
          </p>
          <p className="text-lg leading-relaxed mb-6">
            By combining the authority of Church teaching with the accessibility
            of modern technology, <strong>Truth Me Up</strong> is helping the
            Church&apos;s mission of spreading the Gospel in a digital world:
          </p>
          <p className="text-lg leading-relaxed mb-6 border-l-4 border-primary pl-6">
            <em>
              The Church must learn to cope with and benefit from the marvels of
              technology in order to proclaim the Gospel to all.
            </em>{" "}
            — Pope John Paul II, Message for the 36th World Communications Day
            (2002)
          </p>

          <div className="border-t border-muted my-8"></div>

          <h2 id="support" className="text-2xl font-bold mb-6">
            Support Truth Me Up
          </h2>
          <p className="text-lg leading-relaxed mb-6">
            Want to support <strong>Truth Me Up</strong>?{" "}
            <a
              href="https://coff.ee/marthasharpe"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center whitespace-nowrap font-medium ring-offset-background transition-all cursor-pointer text-primary hover:text-primary/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              Donate to the developer
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
