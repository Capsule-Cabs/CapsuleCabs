import { Card, CardContent } from "@/components/ui/card";
import { Linkedin, Mail } from "lucide-react";

const FOUNDERS = [
  {
    name: "Vishwas Sharma",
    role: "Co-Founder & CEO",
    bio: "Software Engineer turned entrepreneur. Passionate about solving real-world problems through technology and creating seamless travel experiences.",
    image: "VS",
    linkedin: "https://www.linkedin.com/in/vishxwas-sharma/",
    email: "vishwassharma332@gmail.com",
  },
  {
    name: "Vishal Solanki",
    role: "Co-Founder & CTO",
    bio: "Engineer → founder. Building the future of intercity travel, reimagine how people travel—starting with the problems commuters face every day.",
    image: "PS",
    linkedin: "https://www.linkedin.com/in/vishal-solanki-147a1b1a9/",
    email: "vishalsolanki14002@capsulecabs.com",
  },
];

export const AboutUs = () => {
  return (
    <section
      id="about"
      className="border-t border-white/5 bg-black py-12 sm:py-16"
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <span className="text-xs uppercase tracking-wider text-white/50">
            About Us
          </span>
          <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight mt-2">
            Meet the team behind CapsuleCabs
          </h2>
          <p className="mt-4 text-sm sm:text-base text-white/60 max-w-2xl mx-auto">
            We built CapsuleCabs because we were tired of unpredictable
            intercity travel. After 6 months of testing with early riders
            between Gurugram and Agra, we're excited to open our doors to
            everyone.
          </p>
        </div>

        {/* Founders Grid */}
        <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
          {FOUNDERS.map((founder) => (
            <Card
              key={founder.name}
              className="bg-white/5 border-white/10 hover:border-emerald-400/60 transition-all duration-300 hover:-translate-y-1 group"
            >
              <CardContent className="pt-6 pb-6 px-6">
                {/* Avatar and Header */}
                <div className="flex items-start gap-4 mb-4">
                  <div className="h-16 w-16 rounded-full bg-gradient-to-br from-emerald-400 to-lime-300 flex items-center justify-center text-black font-bold text-xl flex-shrink-0">
                    {founder.image}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-semibold text-white">{founder.name}</h3>
                    <p className="text-sm text-emerald-300">{founder.role}</p>
                  </div>
                </div>

                {/* Bio */}
                <p className="text-sm text-white/70 leading-relaxed mb-4">
                  {founder.bio}
                </p>

                {/* Social Links */}
                <div className="flex items-center gap-3 pt-4 border-t border-white/10">
                  <a
                    href={founder.linkedin}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-xs text-white/60 hover:text-emerald-300 transition-colors"
                  >
                    <Linkedin className="h-4 w-4" />
                    <span>LinkedIn</span>
                  </a>
                  <span className="text-white/20">•</span>
                  <a
                    href={`mailto:${founder.email}`}
                    className="flex items-center gap-2 text-xs text-white/60 hover:text-emerald-300 transition-colors"
                  >
                    <Mail className="h-4 w-4" />
                    <span>Email</span>
                  </a>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Mission Statement */}
        <div className="mt-12 max-w-3xl mx-auto">
          <Card className="bg-white/5 border-white/10 relative overflow-hidden">
            <div className="pointer-events-none absolute -right-20 -top-20 h-40 w-40 rounded-full bg-emerald-500/10 blur-3xl" />
            <CardContent className="pt-8 pb-8 px-8 text-center relative">
              <p className="text-base sm:text-lg text-white/80 leading-relaxed italic">
                "This is just the beginning—more routes, more features, and more
                reliability coming soon. Thank you for being part of our
                journey."
              </p>
              <p className="mt-4 text-sm text-white/60 font-semibold">
                — Vishal & Vishwas
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
};