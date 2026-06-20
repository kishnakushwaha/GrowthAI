import React from 'react';
import SectionHeader from '../components/SectionHeader';
import { Star, User } from 'lucide-react';

const Reviews = () => {
    const reviews = [
        { name: "Rahul Sharma", text: "The procedure was quick and painless. My teeth feel so clean and fresh. Highly recommended!", rating: 5, date: "2 months ago" },
        { name: "Priya Malhotra", text: "Handled with utmost professionalism. Dr. Shivangi is very gentle and explains everything clearly.", rating: 5, date: "1 month ago" },
        { name: "Amit Kumar", text: "Best dental clinic in Greater Noida. Clean, modern, and very affordable.", rating: 5, date: "3 weeks ago" },
        { name: "Sneha Gupta", text: "I was very anxious about my root canal, but Dr. Shivangi made me feel so comfortable. Painless experience!", rating: 5, date: "1 week ago" },
        { name: "Vikram Singh", text: "Excellent service and hygiene standards. The clinic is very well maintained.", rating: 5, date: "4 months ago" },
        { name: "Anjali Verma", text: "Great experience with teeth whitening. Saw immediate results!", rating: 5, date: "2 months ago" },
    ];

    return (
        <div className="bg-white">
            {/* Header */}
            <div className="bg-primary/5 py-16">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                    <SectionHeader
                        title="Patient Reviews"
                        subtitle="What People Say"
                        className="mb-0"
                    />
                    <div className="flex justify-center items-center gap-2 mt-4">
                        <span className="text-4xl font-bold text-gray-900">5.0</span>
                        <div className="flex text-yellow-400">
                            {[...Array(5)].map((_, i) => <Star key={i} fill="currentColor" size={24} />)}
                        </div>
                        <span className="text-gray-500">(43 Google Reviews)</span>
                    </div>
                </div>
            </div>

            {/* Reviews List */}
            <div className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {reviews.map((review, idx) => (
                        <div key={idx} className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                            <div className="flex items-center gap-4 mb-4">
                                <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center text-gray-500">
                                    <User size={24} />
                                </div>
                                <div>
                                    <h4 className="font-bold text-gray-900">{review.name}</h4>
                                    <p className="text-xs text-gray-500">{review.date}</p>
                                </div>
                                <img src="https://upload.wikimedia.org/wikipedia/commons/5/53/Google_%22G%22_Logo.svg" alt="Google" className="w-5 h-5 ml-auto opacity-50" />
                            </div>
                            <div className="flex text-yellow-400 mb-3">
                                {[...Array(review.rating)].map((_, i) => <Star key={i} fill="currentColor" size={16} />)}
                            </div>
                            <p className="text-gray-600 text-sm leading-relaxed">
                                "{review.text}"
                            </p>
                        </div>
                    ))}
                </div>

                <div className="text-center mt-12">
                    <a
                        href="https://www.google.com/search?q=Dental+Planet+Greater+Noida"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 bg-white border border-gray-300 px-6 py-3 rounded-full font-medium text-gray-700 hover:bg-gray-50 transition-colors shadow-sm"
                    >
                        <img src="https://upload.wikimedia.org/wikipedia/commons/5/53/Google_%22G%22_Logo.svg" alt="Google" className="w-5 h-5" />
                        Write a Review
                    </a>
                </div>
            </div>
        </div>
    );
};

export default Reviews;
