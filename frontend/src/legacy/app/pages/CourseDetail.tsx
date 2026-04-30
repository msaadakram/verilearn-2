import { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router';
import { Header } from '../components/Header';
import { Footer } from '../components/Footer';
import { Button } from '../components/Button';
import { ImageWithFallback } from '../components/figma/ImageWithFallback';
import { courses } from '../data/courses';
import {
  Star, Clock, BookOpen, Users, CheckCircle2, ChevronDown, ChevronUp,
  Play, Award, Globe, ArrowLeft, Heart, Share2, ShieldCheck, RotateCcw,
  Infinity, Download
} from 'lucide-react';

function ModuleAccordion({ module, index }: { module: { title: string; lessons: string[]; duration: string }; index: number }) {
  const [open, setOpen] = useState(index === 0);
  return (
    <div className="border border-[var(--border)] rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-5 py-4 hover:bg-[var(--muted)] transition-colors"
      >
        <div className="flex items-center gap-3 text-left">
          <span className="w-8 h-8 rounded-lg bg-[var(--teal-100)] text-[var(--teal-600)] flex items-center justify-center text-sm shrink-0">
            {index + 1}
          </span>
          <div>
            <span className="text-[var(--navy-900)]">{module.title}</span>
            <span className="text-sm text-[var(--muted-foreground)] ml-3">{module.lessons.length} lessons · {module.duration}</span>
          </div>
        </div>
        {open ? <ChevronUp className="w-5 h-5 text-[var(--muted-foreground)] shrink-0" /> : <ChevronDown className="w-5 h-5 text-[var(--muted-foreground)] shrink-0" />}
      </button>
      {open && (
        <div className="px-5 pb-4 space-y-2">
          {module.lessons.map((lesson, i) => (
            <div key={i} className="flex items-center gap-3 py-2 pl-11 text-sm text-[var(--muted-foreground)]">
              <Play className="w-3.5 h-3.5 shrink-0" />
              {lesson}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function CourseDetail() {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const course = courses.find((c) => c.id === courseId);

  if (!course) {
    return (
      <div className="min-h-screen flex flex-col">
        <div className="flex-1 flex items-center justify-center pt-20">
          <div className="text-center">
            <h2 className="text-2xl text-[var(--navy-900)] mb-4">Course not found</h2>
            <Link to="/courses" className="text-[var(--teal-400)] hover:underline">Browse all courses</Link>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  const discount = Math.round((1 - course.price / course.originalPrice) * 100);
  const totalLessons = course.modules.reduce((acc, m) => acc + m.lessons.length, 0);

  return (
    <div className="min-h-screen flex flex-col bg-[var(--muted)]">

      {/* Course Hero */}
      <section className="pt-20 bg-[var(--navy-900)]">
        <div className="max-w-7xl mx-auto px-6 py-12">
          <button
            onClick={() => navigate('/courses')}
            className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-6 text-sm"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Courses
          </button>

          <div className="grid lg:grid-cols-[1fr_400px] gap-10 items-start">
            <div>
              <div className="flex flex-wrap items-center gap-3 mb-4">
                {course.badge && (
                  <span className="px-3 py-1 rounded-full text-white text-xs" style={{ backgroundColor: course.color }}>
                    {course.badge}
                  </span>
                )}
                <span className="px-3 py-1 rounded-full bg-white/10 text-gray-300 text-xs">{course.category}</span>
                <span className="px-3 py-1 rounded-full bg-white/10 text-gray-300 text-xs">{course.level}</span>
              </div>

              <h1 className="text-3xl md:text-4xl text-white mb-2" style={{ lineHeight: 1.2 }}>
                {course.icon} {course.title}
              </h1>
              <p className="text-xl text-gray-300 mb-5">{course.subtitle}</p>
              <p className="text-gray-400 leading-relaxed mb-6 max-w-2xl">{course.description}</p>

              <div className="flex flex-wrap items-center gap-6 text-sm text-gray-300 mb-6">
                <span className="flex items-center gap-1.5">
                  <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                  <span className="text-white">{course.rating}</span> ({course.reviews.toLocaleString()} reviews)
                </span>
                <span className="flex items-center gap-1.5">
                  <Users className="w-4 h-4" /> {course.students} students
                </span>
                <span className="flex items-center gap-1.5">
                  <Clock className="w-4 h-4" /> {course.duration}
                </span>
                <span className="flex items-center gap-1.5">
                  <BookOpen className="w-4 h-4" /> {course.lessons} lessons
                </span>
              </div>

              <div className="flex items-center gap-4 text-sm text-gray-400">
                <div className="w-10 h-10 rounded-full bg-[var(--teal-300)] flex items-center justify-center text-white">
                  {course.instructor.name.charAt(0)}
                </div>
                <div>
                  <p className="text-white">{course.instructor.name}</p>
                  <p>{course.instructor.title}</p>
                </div>
              </div>
            </div>

            {/* Sticky Card - Desktop */}
            <div className="hidden lg:block">
              <div className="bg-white rounded-2xl overflow-hidden shadow-2xl sticky top-24">
                <ImageWithFallback src={course.image} alt={course.title} className="w-full h-48 object-cover" />
                <div className="p-6">
                  <div className="flex items-baseline gap-3 mb-1">
                    <span className="text-3xl text-[var(--navy-900)]">${course.price}</span>
                    <span className="text-lg text-[var(--muted-foreground)] line-through">${course.originalPrice}</span>
                    <span className="text-sm text-green-600 bg-green-50 px-2 py-0.5 rounded-full">{discount}% off</span>
                  </div>
                  <p className="text-sm text-red-500 mb-5">⏰ Sale ends in 2 days</p>

                  <Link to="/signup">
                    <Button variant="secondary" size="lg" className="w-full mb-3">
                      Enroll Now
                    </Button>
                  </Link>
                  <Button variant="outline" size="md" className="w-full mb-5">
                    <Heart className="w-4 h-4" /> Add to Wishlist
                  </Button>

                  <p className="text-center text-sm text-[var(--muted-foreground)] mb-5">30-day money-back guarantee</p>

                  <div className="space-y-3 text-sm">
                    <div className="flex items-center gap-3 text-[var(--foreground)]">
                      <Infinity className="w-4 h-4 text-[var(--teal-400)] shrink-0" /> Lifetime access
                    </div>
                    <div className="flex items-center gap-3 text-[var(--foreground)]">
                      <Download className="w-4 h-4 text-[var(--teal-400)] shrink-0" /> Downloadable resources
                    </div>
                    <div className="flex items-center gap-3 text-[var(--foreground)]">
                      <Award className="w-4 h-4 text-[var(--teal-400)] shrink-0" /> Certificate of completion
                    </div>
                    <div className="flex items-center gap-3 text-[var(--foreground)]">
                      <Globe className="w-4 h-4 text-[var(--teal-400)] shrink-0" /> Access on mobile & desktop
                    </div>
                    <div className="flex items-center gap-3 text-[var(--foreground)]">
                      <ShieldCheck className="w-4 h-4 text-[var(--teal-400)] shrink-0" /> Money-back guarantee
                    </div>
                  </div>

                  <div className="mt-5 pt-4 border-t border-[var(--border)] flex justify-center">
                    <button className="flex items-center gap-2 text-sm text-[var(--muted-foreground)] hover:text-[var(--navy-900)] transition-colors">
                      <Share2 className="w-4 h-4" /> Share this course
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Mobile CTA */}
      <div className="lg:hidden sticky top-[73px] z-40 bg-white border-b border-[var(--border)] px-6 py-3 flex items-center justify-between gap-4">
        <div>
          <span className="text-xl text-[var(--navy-900)]">${course.price}</span>
          <span className="text-sm text-[var(--muted-foreground)] line-through ml-2">${course.originalPrice}</span>
        </div>
        <Link to="/signup">
          <Button variant="secondary" size="sm">Enroll Now</Button>
        </Link>
      </div>

      {/* Content */}
      <section className="py-12 flex-1">
        <div className="max-w-7xl mx-auto px-6">
          <div className="lg:grid lg:grid-cols-[1fr_400px] gap-10">
            <div className="space-y-12">

              {/* What You'll Learn */}
              <div className="bg-white rounded-2xl p-8 shadow-sm">
                <h2 className="text-2xl text-[var(--navy-900)] mb-6">What you'll learn</h2>
                <div className="grid sm:grid-cols-2 gap-3">
                  {course.whatYouLearn.map((item, i) => (
                    <div key={i} className="flex gap-3 items-start">
                      <CheckCircle2 className="w-5 h-5 text-[var(--teal-400)] shrink-0 mt-0.5" />
                      <span className="text-sm text-[var(--foreground)]">{item}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Course Highlights */}
              <div className="bg-white rounded-2xl p-8 shadow-sm">
                <h2 className="text-2xl text-[var(--navy-900)] mb-6">Course highlights</h2>
                <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
                  {course.highlights.map((h, i) => (
                    <div key={i} className="flex items-center gap-3 bg-[var(--teal-50)] rounded-xl px-4 py-3">
                      <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: course.color }} />
                      <span className="text-sm text-[var(--navy-900)]">{h}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Curriculum */}
              <div className="bg-white rounded-2xl p-8 shadow-sm">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl text-[var(--navy-900)]">Course curriculum</h2>
                  <span className="text-sm text-[var(--muted-foreground)]">
                    {course.modules.length} modules · {totalLessons} lessons · {course.duration}
                  </span>
                </div>
                <div className="space-y-3">
                  {course.modules.map((mod, i) => (
                    <ModuleAccordion key={i} module={mod} index={i} />
                  ))}
                </div>
              </div>

              {/* Requirements */}
              <div className="bg-white rounded-2xl p-8 shadow-sm">
                <h2 className="text-2xl text-[var(--navy-900)] mb-6">Requirements</h2>
                <ul className="space-y-3">
                  {course.requirements.map((r, i) => (
                    <li key={i} className="flex items-start gap-3 text-[var(--foreground)]">
                      <span className="w-1.5 h-1.5 rounded-full bg-[var(--teal-400)] mt-2 shrink-0" />
                      {r}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Instructor */}
              <div className="bg-white rounded-2xl p-8 shadow-sm">
                <h2 className="text-2xl text-[var(--navy-900)] mb-6">Your instructor</h2>
                <div className="flex items-start gap-5">
                  <div className="w-20 h-20 rounded-2xl flex items-center justify-center text-2xl text-white shrink-0" style={{ backgroundColor: course.color }}>
                    {course.instructor.name.charAt(0)}
                  </div>
                  <div>
                    <h3 className="text-[var(--navy-900)] text-lg">{course.instructor.name}</h3>
                    <p className="text-[var(--muted-foreground)] mb-3">{course.instructor.title}</p>
                    <div className="flex flex-wrap gap-4 text-sm text-[var(--muted-foreground)]">
                      <span className="flex items-center gap-1">
                        <Star className="w-4 h-4 fill-amber-400 text-amber-400" /> {course.instructor.rating} rating
                      </span>
                      <span className="flex items-center gap-1">
                        <Users className="w-4 h-4" /> {course.instructor.students} students
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Tags */}
              <div className="flex flex-wrap gap-2">
                {course.tags.map((tag) => (
                  <span key={tag} className="px-4 py-2 bg-white rounded-full text-sm text-[var(--muted-foreground)] border border-[var(--border)]">
                    {tag}
                  </span>
                ))}
              </div>
            </div>

            {/* Spacer for desktop sticky card */}
            <div className="hidden lg:block" />
          </div>
        </div>
      </section>

      {/* Related Courses */}
      <section className="py-12 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <h2 className="text-2xl text-[var(--navy-900)] mb-8">Other courses you might like</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {courses
              .filter((c) => c.id !== course.id)
              .slice(0, 3)
              .map((c) => (
                <Link
                  key={c.id}
                  to={`/courses/${c.id}`}
                  className="group flex gap-4 p-4 rounded-xl border border-[var(--border)] hover:shadow-md transition-all"
                >
                  <ImageWithFallback src={c.image} alt={c.title} className="w-24 h-24 rounded-lg object-cover shrink-0" />
                  <div className="flex flex-col justify-center min-w-0">
                    <p className="text-xs text-[var(--teal-500)] mb-1">{c.category}</p>
                    <h4 className="text-[var(--navy-900)] truncate group-hover:text-[var(--teal-500)] transition-colors">{c.icon} {c.title}</h4>
                    <div className="flex items-center gap-2 mt-1 text-sm text-[var(--muted-foreground)]">
                      <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" /> {c.rating}
                      <span className="ml-auto">${c.price}</span>
                    </div>
                  </div>
                </Link>
              ))}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}