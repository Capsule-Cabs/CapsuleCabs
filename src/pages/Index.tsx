import { Navigation } from "@/components/ui/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, Shield, Clock, MapPin, Star, Users } from "lucide-react";
import { Link } from "react-router-dom";
import heroImage from "@/assets/hero-cab.jpg";
import { AuthContext } from "@/contexts/AuthContext";
import { useContext } from "react";

const FEATURES = [
  {
    icon: <Clock className="h-6 w-6" />,
    title: "All week Service",
    description: "Book your ride anytime, anywhere with our all days week service"
  },
  {
    icon: <Shield className="h-6 w-6" />,
    title: "Safe & Secure",
    description: "All our drivers are verified and vehicles undergo regular safety checks"
  },
  {
    icon: <MapPin className="h-6 w-6" />,
    title: "Choose Your Pick and Drop",
    description: "Select from multiple pick and drop and time slots that work best for you"
  },
  {
    icon: <Star className="h-6 w-6" />,
    title: "Premium Experience",
    description: "Enjoy comfortable rides with professional drivers and clean vehicles"
  }
];

const TESTIMONIALS = [
  {
    name: "Sarah Johnson",
    rating: 5,
    comment: "Excellent service! The booking process was smooth and the driver was very professional.",
    avatar: "👩‍💼"
  },
  {
    name: "Mike Chen",
    rating: 5,
    comment: "Love the seat selection feature. Makes traveling with friends so much easier to coordinate.",
    avatar: "👨‍💻"
  },
  {
    name: "Emma Davis",
    rating: 5,
    comment: "Reliable, affordable, and comfortable. My go-to choice for daily commuting.",
    avatar: "👩‍🎓"
  }
];

const Index = () => {
  const { isAuthenticated } = useContext(AuthContext);
  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      {/* Hero Section */}
      <section className="relative">
        <div className="hero-gradient-subtle min-h-[80vh] flex items-center">
          <div className="container mx-auto px-4 py-20">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div className="space-y-8">
                <Badge variant="outline" className="w-fit">
                  Premium Cab Booking Service
                </Badge>
                <h1 className="text-5xl lg:text-6xl font-bold leading-tight">
                  Book Your Perfect
                  <span className="text-primary block">Ride Today</span>
                </h1>
                <p className="text-xl text-muted-foreground leading-relaxed">
                  Experience comfortable, safe, and reliable transportation with our premium cab booking service. 
                  Choose your preferred seat, time, and route for the perfect journey.
                </p>
                <div className="flex flex-col sm:flex-row gap-4">
                  <Link to="/booking">
                    <Button size="lg" className="text-lg px-8 group">
                      Book a Cab Now
                      <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-smooth" />
                    </Button>
                  </Link>
                  <Link to="/dashboard">
                    <Button variant="outline" size="lg" className="text-lg px-8">
                      View Dashboard
                    </Button>
                  </Link>
                </div>
                {/* <div className="flex items-center gap-8 pt-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-primary">10K+</div>
                    <div className="text-sm text-muted-foreground">Happy Customers</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-primary">4.9</div>
                    <div className="text-sm text-muted-foreground">Rating</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-primary">24/7</div>
                    <div className="text-sm text-muted-foreground">Support</div>
                  </div>
                </div> */}
              </div>
              <div className="relative">
                <div className="float-animation">
                  <img 
                    src={heroImage} 
                    alt="Premium cab service" 
                    className="rounded-2xl shadow-2xl w-full max-w-lg mx-auto"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-surface-elevated">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">Why Choose CapsuleCabs?</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              We provide premium transportation services with features designed for your comfort and convenience
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {FEATURES.map((feature, index) => (
              <Card key={index} className="text-center transition-smooth hover:shadow-lg hover:-translate-y-1">
                <CardHeader>
                  <div className="mx-auto mb-4 w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center text-primary">
                    {feature.icon}
                  </div>
                  <CardTitle className="text-xl">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">How It Works</h2>
            <p className="text-xl text-muted-foreground">
              Book your ride in just a few simple steps
            </p>
          </div>
          <div className="grid md:grid-cols-5 gap-8 items-center">
            {[
              { step: 1, title: "Select Date", desc: "Choose your travel date" },
              { step: 2, title: "Pick Cab & Time", desc: "Select your preferred vehicle and time slot" },
              { step: 3, title: "Choose Seat", desc: "Pick your seat from the layout" },
              { step: 4, title: "Make Payment", desc: "Secure payment process" },
              { step: 5, title: "Enjoy Ride", desc: "Relax and enjoy your journey" }
            ].map((item, index) => (
              <div key={item.step} className="text-center relative">
                <div className="w-16 h-16 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-4">
                  {item.step}
                </div>
                <h3 className="font-semibold mb-2">{item.title}</h3>
                <p className="text-sm text-muted-foreground">{item.desc}</p>
                {index < 4 && (
                  <div className="hidden md:block absolute top-8 left-full w-full">
                    <ArrowRight className="h-6 w-6 text-primary ml-0 mr-auto" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section
      <section className="py-20 bg-surface-elevated">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">What Our Customers Say</h2>
            <p className="text-xl text-muted-foreground">
              Join thousands of satisfied customers who trust CapsuleCabs
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {TESTIMONIALS.map((testimonial, index) => (
              <Card key={index} className="transition-smooth hover:shadow-lg">
                <CardContent className="p-6">
                  <div className="flex items-center mb-4">
                    <span className="text-3xl mr-3">{testimonial.avatar}</span>
                    <div>
                      <h4 className="font-semibold">{testimonial.name}</h4>
                      <div className="flex">
                        {[...Array(testimonial.rating)].map((_, i) => (
                          <Star key={i} className="h-4 w-4 fill-current text-yellow-400" />
                        ))}
                      </div>
                    </div>
                  </div>
                  <p className="text-muted-foreground italic">"{testimonial.comment}"</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section> */}

      {/* CTA Section */}
      <section className="py-20 hero-gradient text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-4xl font-bold mb-4">Ready to Book Your Ride?</h2>
          <p className="text-xl opacity-90 mb-8 max-w-2xl mx-auto">
            Join thousands of satisfied customers and experience the best in class cab booking service
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/booking">
              <Button size="lg" variant="secondary" className="text-lg px-8">
                <Users className="mr-2 h-5 w-5" />
                Start Booking Now
              </Button>
            </Link>
            {!isAuthenticated && <Link to="/login">
              <Button size="lg" variant="outline" className="text-lg px-8 bg-white/20 border-white/30 text-white hover:bg-white/30">
                Sign In
              </Button>
            </Link>}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-foreground text-background py-12">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <h3 className="font-bold text-lg mb-4">CapsuleCabs</h3>
              <p className="text-sm opacity-80">
                Premium cab booking service providing safe, comfortable, and reliable transportation.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Services</h4>
              <ul className="space-y-2 text-sm opacity-80">
                <li>Premium Sedan</li>
                <li>SUV Comfort</li>
                <li>Luxury Premium</li>
                <li>24/7 Support</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-sm opacity-80">
                <li>About Us</li>
                <li>Contact</li>
                <li>Careers</li>
                <li>Safety</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Support</h4>
              <ul className="space-y-2 text-sm opacity-80">
                <li>Help Center</li>
                <li>Terms of Service</li>
                <li>Privacy Policy</li>
                <li>Refund Policy</li>
              </ul>
            </div>
          </div>
          <div className="border-t border-white/20 mt-8 pt-8 text-center text-sm opacity-80">
            <p>&copy; 2024 Capsule Cabs. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
