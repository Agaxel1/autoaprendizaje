import React from 'react';
import Header from '../components/Header';
import LevelList from '../components/LeveList';
import '../CSS/Home.css';

const Home = () => {
  return (
    <div className="home">
      <Header />
      <main>
        <LevelList />
      </main>
    </div>
  );
};

export default Home;
