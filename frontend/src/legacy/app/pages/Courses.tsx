import { useState } from 'react';
import { Link } from 'react-router';
import { Header } from '../components/Header';
import { Footer } from '../components/Footer';
import { ImageWithFallback } from '../components/figma/ImageWithFallback';
import { courses } from '../data/courses';
import { Star, Clock, BookOpen, Users, ArrowRight, Search, SlidersHorizontal } from 'lucide-react';

const categories = ['All', 'Programming', 'Web Development', 'QA & Testing', '3D & Design', 'Automation'];
const levels = ['All Levels', 'Beginner', 'Intermediate', 'Advanced'];

export function Courses() {
  const [activeCategory, setActiveCategory] = useState('All');
  const [activeLevel, setActiveLevel] = useState('All Levels');
  const [searchQuery, setSearchQuery] = useState('');

  const filtered = courses.filter((c) => {
    const matchesCategory = activeCategory === 'All' || c.category === activeCategory;
    const matchesLevel = activeLevel === 'All Levels' || c.level === activeLevel;
    const matchesSearch =
      !searchQuery.trim() ||
      c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.tags.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCategory && matchesLevel && matchesSearch;
  });

  return (
    <div className="min-h-screen flex flex-col">

      {/* Hero */}
      <section className="pt-28 pb-12 bg-gradient-to-b from-[var(--teal-50)] to-white">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <span className="inline-block px-4 py-1.5 bg-[var(--teal-100)] text-[var(--teal-600)] rounded-full text-sm mb-5">
            {courses.length} Courses Available
          </span>
          <h1 className="text-4xl md:text-5xl text-[var(--navy-900)] mb-4" style={{ lineHeight: 1.15 }}>
            Level up your skills
          </h1>
          <p className="text-[var(--muted-foreground)] text-lg max-w-2xl mx-auto mb-8">
            Industry-leading courses taught by experts. Hands-on projects, real-world skills, and certificates to prove it.
          </p>
          <div className="relative max-w-xl mx-auto">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--muted-foreground)]" />
            <input
              type="text"
              placeholder="Search courses or topics..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3.5 rounded-xl border border-[var(--border)] bg-white focus:outline-none focus:ring-2 focus:ring-[var(--teal-300)] transition-all"
            />
          </div>
        </div>
      </section>

      {/* Filters */}
      <section className="py-6 border-b border-[var(--border)] sticky top-[73px] bg-white/95 backdrop-blur-sm z-40">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <div className="flex flex-wrap gap-2">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={`px-4 py-2 rounded-lg text-sm transition-all ${
                    activeCategory === cat
                      ? 'bg-[var(--navy-900)] text-white'
                      : 'bg-[var(--muted)] text-[var(--muted-foreground)] hover:bg-[var(--teal-50)]'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-2">
              <SlidersHorizontal className="w-4 h-4 text-[var(--muted-foreground)]" />
              <select
                value={activeLevel}
                onChange={(e) => setActiveLevel(e.target.value)}
                className="px-3 py-2 rounded-lg border border-[var(--border)] bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[var(--teal-300)]"
              >
                {levels.map((l) => (
                  <option key={l}>{l}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </section>

      {/* Course Grid */}
      <section className="py-12 flex-1">
        <div className="max-w-7xl mx-auto px-6">
          {filtered.length === 0 ? (
            <div className="text-center py-20 text-[var(--muted-foreground)]">
              <BookOpen className="w-16 h-16 mx-auto mb-4 opacity-20" />
              <p className="text-lg">No courses match your filters.</p>
              <button onClick={() => { setActiveCategory('All'); setActiveLevel('All Levels'); setSearchQuery(''); }} className="mt-4 text-[var(--teal-400)] hover:underline">
                Clear filters
              </button>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {filtered.map((course) => (
                <Link
                  key={course.id}
                  to={`/courses/${course.id}`}
                  className="group bg-white rounded-2xl border border-[var(--border)] overflow-hidden hover:shadow-xl transition-all duration-300 hover:-translate-y-1 flex flex-col"
                >
                  <div className="relative overflow-hidden">
                    <ImageWithFallback
                      src={course.image}
                      alt={course.title}
                      className="w-full h-52 object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    {course.badge && (
                      <span
                        className="absolute top-4 left-4 px-3 py-1 rounded-full text-white text-xs"
                        style={{ backgroundColor: course.color }}
                      >
                        {course.badge}
                      </span>
                    )}
                    <span className="absolute top-4 right-4 px-3 py-1 rounded-full bg-black/60 text-white text-xs backdrop-blur-sm">
                      {course.level}
                    </span>
                  </div>

                  <div className="p-6 flex flex-col flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xs text-[var(--teal-500)] bg-[var(--teal-50)] px-2 py-1 rounded">
                        {course.category}
                      </span>
                    </div>
                    <h3 className="text-[var(--navy-900)] mb-1 group-hover:text-[var(--teal-500)] transition-colors">
                      {course.icon} {course.title}
                    </h3>
                    <p className="text-sm text-[var(--muted-foreground)] mb-4">{course.subtitle}</p>

                    <div className="flex items-center gap-4 text-sm text-[var(--muted-foreground)] mb-4">
                      <span className="flex items-center gap-1">
                        <Clock className="w-4 h-4" /> {course.duration}
                      </span>
                      <span className="flex items-center gap-1">
                        <BookOpen className="w-4 h-4" /> {course.lessons} lessons
                      </span>
                    </div>

                    <div className="flex items-center gap-2 mb-4">
                      <div className="flex items-center gap-1">
                        <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                        <span className="text-sm text-[var(--navy-900)]">{course.rating}</span>
                      </div>
                      <span className="text-sm text-[var(--muted-foreground)]">({course.reviews.toLocaleString()} reviews)</span>
                      <span className="text-sm text-[var(--muted-foreground)] ml-auto flex items-center gap-1">
                        <Users className="w-4 h-4" /> {course.students}
                      </span>
                    </div>

                    <div className="mt-auto pt-4 border-t border-[var(--border)] flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-2xl text-[var(--navy-900)]">${course.price}</span>
                        <span className="text-sm text-[var(--muted-foreground)] line-through">${course.originalPrice}</span>
                        <span className="text-xs text-green-600 bg-green-50 px-2 py-0.5 rounded-full">
                          {Math.round((1 - course.price / course.originalPrice) * 100)}% off
                        </span>
                      </div>
                      <ArrowRight className="w-5 h-5 text-[var(--teal-400)] group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      <Footer />
    </div>
  );
}