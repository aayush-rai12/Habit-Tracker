
import { Link } from 'react-router-dom';

export default function LandingPage() {
  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-[#F7F7F7] p-4">

      {/* Main White Card */}
<div className="landing-card relative aspect-[1760/907] w-full max-w-[1560px] overflow-hidden rounded-[40px] bg-white shadow-[0px_4px_40px_rgba(83,72,199,0.08)] mx-[100px]">
        {/* Left Side Content */}
        <div className="absolute left-[13.2%] top-[7.9%] flex h-[84%] w-[44%] flex-col">

          {/* Logo */}
          <h1 className="font-['Poppins'] text-[clamp(2rem,4.6cqw,4.5rem)] font-bold leading-none text-[#5348C7]">
            Trieon Technosolution Habits Tracker
          </h1>

          {/* Heading */}
          <h2 className="mt-[12%] font-['Poppins'] text-[1.55rem] font-bold leading-[1.25] text-black">
            Meet your modern
            <br />
            <span className="text-[#5348C7]">Habit Tracker App</span>
          </h2>

          {/* Description */}
          <p className="mt-[3%] w-[340.117px] max-w-full font-['Poppins'] text-[clamp(1rem,1.5cqw,1.5rem)] font-normal leading-[1.25] text-black">
            Manage your daily tasks and workflow in a modern way and boost your efficiency without any efforts.
          </p>

          {/* CTA */}
          <div className="mb-[1%] mt-auto">

            <Link
              to="/signup"
              className="inline-flex h-[10%] min-h-[50px] w-[45%] items-center justify-center rounded bg-[#5348C7] text-[clamp(1rem,1.5cqw,1.5rem)] font-semibold text-white shadow-md transition-colors hover:bg-[#4239A8]"
            >
              Join Now
            </Link>

            <p className="mt-[5%] font-['Poppins'] text-[clamp(1rem,1.5cqw,1.5rem)] text-[#5348C7]">
              Already have an account?{' '}
              <Link
                to="/login"
                className="font-semibold underline"
              >
                Login
              </Link>
            </p>

          </div>
        </div>

        {/* Right Illustration */}
        <div className="absolute right-[3.5%] top-0 flex h-full w-[32.5%] items-center justify-center">

          <img
            src="/saly.png"
            alt="Habit Tracker Illustration"
            className="h-full w-full object-contain object-center"
          />

        </div>

      </div>
    </div>
  );
}
