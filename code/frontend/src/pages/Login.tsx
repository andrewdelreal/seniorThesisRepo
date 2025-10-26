import "../css/Login.module.css"
import { GoogleOAuthProvider, GoogleLogin } from "@react-oauth/google";
import { jwtDecode } from "jwt-decode";
import axios from "axios";
import { useNavigate } from "react-router-dom";

type GoogleUser = {
  sub: string;
  email: string;
  name: string;
};

function Login() {
  const navigate = useNavigate();

  const handleSuccess = async (credentialResponse: any) => {
    if (!credentialResponse.credential) return;

    // Decode token to get user info
    const decoded: GoogleUser = jwtDecode<GoogleUser>(credentialResponse.credential);
    console.log("Google user:", decoded);

    try {
      const res = await axios.post("http://localhost:3000/api/auth/google", { // verify user with backend
        token: credentialResponse.credential,
      });

      console.log("Server response:", res.data);

      localStorage.setItem("token", res.data.appToken); // Store your app token (valid for 7 days)
      localStorage.setItem("googleId", decoded.sub); // store google user id (constant)
      localStorage.setItem("googleName", decoded.name?.split(" ")[0] || "User"); // store first name for UI

      console.log(localStorage.getItem("token"));
      console.log(localStorage.getItem("googleId"));
      console.log(localStorage.getItem("googleName"));

      navigate("/"); // Redirect to home after login
    } catch (err) {
      console.error('Error during authentication:', err);
    }
  };

  return (
    <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID}>
      <div style={{ textAlign: "center", marginTop: "50px" }}>
        <h2>Login with Google</h2>
        <p>Stock Learning uses the Google OAutorization protocal <br/>
          to provide secure login and authentication services.
        </p>
        <div style={{position: "relative", display: "inline-block", marginTop: "20px"}}>
          <GoogleLogin
            onSuccess={handleSuccess}
            onError={() => console.log("Login Failed")}
            theme="filled_blue"
            width={240}
            
          />
        </div>
      </div>
    </GoogleOAuthProvider>
  );
}

export default Login;
