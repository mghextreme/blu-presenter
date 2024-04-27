import { Link } from "react-router-dom";

export default function Welcome() {
  return (
    <div>
      <h1>Welcome!</h1>
      <br/>
      <Link to={'/controller'}>Go to controller</Link>
    </div>
  );
}
