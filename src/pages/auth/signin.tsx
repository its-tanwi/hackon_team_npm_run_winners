import { GetServerSideProps } from "next";
import { useRouter } from "next/router";
import Image from "next/image";
import logo from "../../images/logo.png";
import { useAuth } from "../../hooks/useAuth";
import { useDispatch } from "react-redux";
import { addUser } from "../../store/nextSlice";
import { useEffect } from "react";

const SignIn = () => {
  const router = useRouter();
  const { user, loading, signInWithGoogle } = useAuth();
  const dispatch = useDispatch();

  useEffect(() => {
    // If user is already signed in, redirect to home
    if (user) {
      router.push("/");
    }
  }, [user, router]);

  const handleGoogleSignIn = async () => {
    try {
      const user = await signInWithGoogle();
      if (user) {
        dispatch(addUser({
          name: user.displayName,
          email: user.email,
          image: user.photoURL,
        }));
        router.push("/");
      }
    } catch (error) {
      console.error('Sign in error:', error);
      alert("Sign in failed. Please try again.");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amazon_blue mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <div className="max-w-md w-full bg-white rounded-lg shadow-md p-8">
        <div className="text-center mb-8">
          <Image src={logo} alt="Amazon Logo" className="w-32 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900">Sign in to Amazon</h1>
        </div>
        
        <div className="space-y-4">
          <button
            onClick={handleGoogleSignIn}
            disabled={loading}
            className="w-full flex items-center justify-center px-4 py-3 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
              <path
                fill="#4285f4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34a853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#fbbc05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="#ea4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            {loading ? 'Signing in...' : 'Continue with Google'}
          </button>
        </div>
        
        <div className="mt-6 text-center">
          <button
            onClick={() => router.push("/")}
            className="text-sm text-amazon_blue hover:underline"
          >
            ← Back to Amazon
          </button>
        </div>
      </div>
    </div>
  );
};

// Since we're using Firebase Auth (client-side), we don't need server-side props
// But we can keep this for consistency or future server-side logic
export const getServerSideProps: GetServerSideProps = async () => {
  // No server-side session check needed with Firebase Auth
  // Firebase handles auth state on the client side
  return {
    props: {},
  };
};

export default SignIn;
