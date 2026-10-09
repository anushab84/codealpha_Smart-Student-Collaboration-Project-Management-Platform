import React from 'react';
import { Hero } from '../components/Hero';
import { SystemStatus } from '../components/SystemStatus';
import { FeatureGrid } from '../components/FeatureGrid';

export const Home = () => {
  return (
    <div className="space-y-6">
      <Hero />
      <SystemStatus />
      <FeatureGrid />
    </div>
  );
};

export default Home;
