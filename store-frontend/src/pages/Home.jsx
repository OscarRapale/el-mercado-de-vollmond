// src/pages/Home.jsx
import React from 'react';
import Hero from '../components/home/Hero';
import StorySection from '../components/home/StorySection';
import CategoryShowcase from '../components/home/CategoryShowcase';
import Newsletter from '../components/home/Newsletter';

const Home = () => {
  return (
    <div className="home-page">
      <Hero />
      <StorySection />
      <CategoryShowcase />
      <Newsletter />
    </div>
  );
};

export default Home;
