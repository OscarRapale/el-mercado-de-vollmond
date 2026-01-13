// src/pages/About.jsx
import React from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";

const About = () => {
  return (
    <div className="about-page">
      {/* Hero Section */}
      <section className="about-hero">
        <div className="about-hero-overlay"></div>
        <motion.div
          className="about-hero-content"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <h1 className="about-hero-title">Raymond Vollmond</h1>
          <p className="about-hero-subtitle">
            Autor · Creador de Mundos · Narrador
          </p>
        </motion.div>
      </section>

      {/* Main Content */}
      <section className="about-content">
        <div className="about-container">
          {/* Bio Section */}
          <motion.div
            className="about-section"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <div className="about-grid">
              <div className="about-image">
                <img
                  src="https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=800&q=80"
                  alt="Writing desk with books"
                />
              </div>
              <div className="about-text">
                <h2>La Historia Detrás del Autor</h2>
                <p>
                  Raymond Vollmond es un autor puertorriqueño dedicado a crear
                  mundos de fantasía que cautivan la imaginación y tocan el
                  corazón. Con una pasión profunda por la narrativa épica y
                  personajes complejos, cada historia es una invitación a
                  explorar reinos donde la magia y la realidad se entrelazan.
                </p>
                <p>
                  Desde temprana edad, Raymond encontró refugio en las páginas
                  de libros fantásticos, donde dragones surcaban los cielos y
                  héroes desconocidos forjaban su destino. Esta fascinación lo
                  llevó a crear sus propias historias, mundos donde los lectores
                  pueden perderse y encontrarse a sí mismos.
                </p>
              </div>
            </div>
          </motion.div>

          {/* Philosophy Section */}
          <motion.div
            className="about-section philosophy-section"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <h2 className="section-title-center">Filosofía de Escritura</h2>
            <div className="philosophy-grid">
              <div className="philosophy-card">
                <div className="philosophy-icon">✨</div>
                <h3>Mundos Inmersivos</h3>
                <p>
                  Cada historia es un universo completo, con su propia historia,
                  culturas y sistemas de magia cuidadosamente elaborados.
                </p>
              </div>

              <div className="philosophy-card">
                <div className="philosophy-icon">❤️</div>
                <h3>Personajes Profundos</h3>
                <p>
                  Los personajes son el corazón de cada narrativa, con
                  motivaciones complejas y desarrollo emocional auténtico.
                </p>
              </div>

              <div className="philosophy-card">
                <div className="philosophy-icon">⚔️</div>
                <h3>Temas Universales</h3>
                <p>
                  A través de la fantasía, exploramos verdades humanas sobre el
                  coraje, el amor, la pérdida y la redención.
                </p>
              </div>
            </div>
          </motion.div>

          {/* Works Section */}
          <motion.div
            className="about-section works-section"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            <h2 className="section-title-center">El Universo de Vollmond</h2>
            <p className="works-intro">
              El Mercado de Vollmond es más que una colección de libros; es una
              puerta de entrada a mundos interconectados donde cada historia
              añade una nueva capa de profundidad y misterio.
            </p>

            <div className="works-features">
              <div className="feature-item">
                <span className="feature-number">01</span>
                <div className="feature-content">
                  <h3>Catarina Freytas</h3>
                  <p>
                    Una saga épica de aventura, magia y descubrimiento personal
                    que sigue el viaje de una joven heroína en un mundo al borde
                    del caos.
                  </p>
                </div>
              </div>

              <div className="feature-item">
                <span className="feature-number">02</span>
                <div className="feature-content">
                  <h3>El Anillo Perdido</h3>
                  <p>
                    Un misterio envuelto en leyendas antiguas, donde el pasado y
                    el presente colisionan en una búsqueda por un artefacto de
                    poder inimaginable.
                  </p>
                </div>
              </div>

              <div className="feature-item">
                <span className="feature-number">03</span>
                <div className="feature-content">
                  <h3>Marcapáginas y Pines</h3>
                  <p>
                    Coleccionables exclusivos que permiten a los lectores llevar
                    un pedazo de estos mundos mágicos consigo.
                  </p>
                </div>
              </div>
            </div>
          </motion.div>

          {/* CTA Section */}
          <motion.div
            className="about-cta"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            <h2>Comienza Tu Aventura</h2>
            <p>
              Explora las historias que han cautivado a lectores alrededor del
              mundo y descubre por qué el universo de Vollmond es un destino
              literario único.
            </p>
            <div className="cta-buttons">
              <Link to="/products" className="btn-primary">
                Explorar Libros
              </Link>
              <Link to="/contact" className="btn-secondary">
                Contactar al Autor
              </Link>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
};

export default About;
