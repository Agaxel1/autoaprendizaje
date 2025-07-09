// Home.jsx
import CourseList from '../components/CourseList';
import '../CSS/Home.css';

const Home = () => {
  return (
    <div className="home">
      <main>
        <CourseList />
      </main>
    </div>
  );
};

export default Home;