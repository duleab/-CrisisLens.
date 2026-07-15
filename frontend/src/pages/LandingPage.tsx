import React from 'react'
import { useNavigate } from 'react-router-dom'
import { 
  Shield, 
  Zap, 
  Globe, 
  Brain, 
  MessageSquare, 
  Map,
  BarChart3,
  Users,
  ArrowRight,
  CheckCircle
} from 'lucide-react'

const LandingPage: React.FC = () => {
  const navigate = useNavigate()

  const features = [
    {
      icon: Zap,
      title: 'Real-time Detection',
      description: 'AI-powered crisis detection from multiple sources with instant alerts'
    },
    {
      icon: Brain,
      title: 'AI Assistant',
      description: 'Role-based intelligent guidance for citizens, government, and responders'
    },
    {
      icon: Map,
      title: 'Interactive Maps',
      description: 'Geographic visualization of crisis events with severity indicators'
    },
    {
      icon: BarChart3,
      title: 'Analytics Dashboard',
      description: 'Comprehensive insights and trends for informed decision-making'
    }
  ]

  const roles = [
    {
      icon: '👥',
      title: 'Citizens',
      description: 'Personal safety guidance and family protection advice'
    },
    {
      icon: '🏛️',
      title: 'Government',
      description: 'Strategic coordination and resource allocation insights'
    },
    {
      icon: '🚑',
      title: 'Responders',
      description: 'Tactical operations and emergency response coordination'
    },
    {
      icon: '✈️',
      title: 'Travelers',
      description: 'Travel safety advisories and destination guidance'
    }
  ]

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center">
                <span className="text-white font-bold">CL</span>
              </div>
              <h1 className="text-xl font-bold text-gray-900">CrisisLens AI</h1>
            </div>
            
            <button
              onClick={() => navigate('/select-role')}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Get Started
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="bg-gradient-to-br from-blue-50 to-indigo-100 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-5xl font-bold text-gray-900 mb-6">
            Real-Time Crisis Intelligence
            <span className="block text-blue-600">Powered by AI</span>
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-10">
            Advanced disaster detection and management platform providing role-based guidance 
            for citizens, government officials, emergency responders, and travelers.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => navigate('/select-role')}
              className="px-8 py-4 bg-blue-600 text-white text-lg font-medium rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2"
            >
              <span>Launch Dashboard</span>
              <ArrowRight className="w-5 h-5" />
            </button>
            <button
              onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}
              className="px-8 py-4 border-2 border-blue-600 text-blue-600 text-lg font-medium rounded-lg hover:bg-blue-50 transition-colors"
            >
              Learn More
            </button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Advanced Crisis Management
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Comprehensive platform combining real-time data collection, AI analysis, 
              and role-based intelligent assistance.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <div key={index} className="text-center p-6 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors">
                <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <feature.icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">
                  {feature.title}
                </h3>
                <p className="text-gray-600">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Role-based Solutions */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Tailored for Every Role
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Different stakeholders need different information. Our AI provides 
              personalized guidance based on your specific role and responsibilities.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {roles.map((role, index) => (
              <div key={index} className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
                <div className="text-4xl mb-4">{role.icon}</div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {role.title}
                </h3>
                <p className="text-gray-600 text-sm">
                  {role.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Technology Stack */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Powered by Advanced AI
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Our platform leverages cutting-edge technologies for reliable, 
              real-time crisis intelligence and response coordination.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                <Globe className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                Multi-Source Data
              </h3>
              <p className="text-gray-600">
                Real-time collection from official agencies, news sources, 
                and social media for comprehensive coverage.
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-purple-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                <Brain className="w-8 h-8 text-purple-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                AI Classification
              </h3>
              <p className="text-gray-600">
                Advanced machine learning models for accurate crisis detection, 
                classification, and confidence scoring.
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                <MessageSquare className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                Intelligent Assistant
              </h3>
              <p className="text-gray-600">
                Role-based AI assistant providing contextual guidance 
                and recommendations for different user types.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="py-20 bg-blue-600">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-white mb-6">
            Ready to Get Started?
          </h2>
          <p className="text-xl text-blue-100 mb-8">
            Join thousands of users who trust CrisisLens for real-time crisis intelligence.
          </p>
          
          <button
            onClick={() => navigate('/select-role')}
            className="px-8 py-4 bg-white text-blue-600 text-lg font-medium rounded-lg hover:bg-gray-100 transition-colors inline-flex items-center space-x-2"
          >
            <span>Access Dashboard</span>
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center space-x-3 mb-4 md:mb-0">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">CL</span>
              </div>
              <span className="text-white font-semibold">CrisisLens AI</span>
            </div>
            
            <div className="text-gray-400 text-sm text-center md:text-right">
              <p>© 2026 CrisisLens AI Platform</p>
              <p className="mt-1">Real-time Crisis Intelligence & Response</p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default LandingPage