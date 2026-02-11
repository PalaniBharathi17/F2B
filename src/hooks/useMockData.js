import { useState, useEffect } from 'react';

const mockData = {
    farmer: [
        {
            key: '1',
            date: '2024-03-10',
            item: 'Organic Carrots',
            buyer: 'John Smith',
            amount: '$45.00',
            status: 'delivered',
            image: 'https://images.unsplash.com/photo-1590822111281-73345880bc99?ixlib=rb-1.2.1&auto=format&fit=crop&w=150&q=80'
        },
        {
            key: '2',
            date: '2024-03-11',
            item: 'Fresh Strawberries',
            buyer: 'Alice Wong',
            amount: '$120.00',
            status: 'processing',
            image: 'https://images.unsplash.com/photo-1464965911861-746a04b4bca6?ixlib=rb-1.2.1&auto=format&fit=crop&w=150&q=80'
        },
        {
            key: '3',
            date: '2024-03-11',
            item: 'Local Honey',
            buyer: 'Bob Miller',
            amount: '$32.50',
            status: 'transit',
            image: 'https://images.unsplash.com/photo-1587049352846-4a222e784d38?ixlib=rb-1.2.1&auto=format&fit=crop&w=150&q=80'
        }
    ],
    buyer: [
        {
            id: 1,
            name: 'Organic Red Tomatoes',
            price: 4.50,
            unit: 'kg',
            farmer: 'Green Valley Farm',
            distance: '5.2 mi',
            rating: 4.8,
            image: 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80',
            organic: true,
            bulk: true
        },
        {
            id: 2,
            name: 'Fresh Spinach',
            price: 3.20,
            unit: 'bunch',
            farmer: 'Sunny Acres',
            distance: '2.1 mi',
            rating: 4.9,
            image: 'https://images.unsplash.com/photo-1576045057995-568f588f82fb?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80',
            organic: true,
            bulk: false
        },
        {
            id: 3,
            name: 'Artisan Honey',
            price: 12.00,
            unit: 'jar',
            farmer: 'Bees & Bloom',
            distance: '8.5 mi',
            rating: 4.7,
            image: 'https://images.unsplash.com/photo-1587049352846-4a222e784d38?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80',
            organic: false,
            bulk: true
        },
        {
            id: 4,
            name: 'Golden Potatoes',
            price: 5.50,
            unit: '5kg bag',
            farmer: 'Hillside Farm',
            distance: '4.3 mi',
            rating: 4.6,
            image: 'https://images.unsplash.com/photo-1518977676601-b53f02ac6d31?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80',
            organic: true,
            bulk: true
        },
        {
            id: 5,
            name: 'Organic Blueberries',
            price: 6.99,
            unit: 'box',
            farmer: 'Berry Good Farm',
            distance: '10.2 mi',
            rating: 4.9,
            image: 'https://images.unsplash.com/photo-1498557850523-fd3d118b962e?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80',
            organic: true,
            bulk: false
        },
        {
            id: 6,
            name: 'Free Range Eggs',
            price: 7.50,
            unit: 'dozen',
            farmer: 'Hen House',
            distance: '3.7 mi',
            rating: 4.8,
            image: 'https://images.unsplash.com/photo-1506976785307-8732e854ad03?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80',
            organic: false,
            bulk: true
        }
    ],
    admin: [
        {
            key: '1',
            name: 'Sarah Jenkins',
            type: 'Farmer',
            date: '2024-03-11',
            location: 'Portland, OR',
            avatar: 'https://i.pravatar.cc/150?u=sarah'
        },
        {
            key: '2',
            name: 'Mike Johnson',
            type: 'Farmer',
            date: '2024-03-11',
            location: 'Salem, OR',
            avatar: 'https://i.pravatar.cc/150?u=mike'
        },
        {
            key: '3',
            name: 'Emma Wilson',
            type: 'Buyer',
            date: '2024-03-10',
            location: 'Eugene, OR',
            avatar: 'https://i.pravatar.cc/150?u=emma'
        }
    ]
};

const useMockData = (type) => {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const timer = setTimeout(() => {
            setData(mockData[type] || []);
            setLoading(false);
        }, 800);
        return () => clearTimeout(timer);
    }, [type]);

    return { data, loading };
};

export default useMockData;
