import Header from '../components/Header';
import LevelList from '../components/LeveList';
import Footer from '../components/Footer';
import '../CSS/Home.css';

const Home = () => {
  return (
    <div className="home">
      <Header />
      <main>
        <LevelList />
      </main>
      <Footer />
    </div>
  );
};

export default Home;
