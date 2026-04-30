import { Hero } from '../components/Hero';
import { RoleSelection } from '../components/RoleSelection';
import { Features } from '../components/Features';
import { Footer } from '../components/Footer';

export function Home() {
  return (
    <>
      <Hero />
      <RoleSelection />
      <Features />
      <Footer />
    </>
  );
}
