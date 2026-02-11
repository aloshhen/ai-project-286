import { SafeIcon } from './components/SafeIcon';
import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence, useInView } from 'framer-motion'
import maplibregl from 'maplibre-gl'
import { clsx, ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

// Utility for tailwind class merging
function cn(...inputs) {
  return twMerge(clsx(inputs))
}

// Web3Forms Hook
const useFormHandler = () => {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [isError, setIsError] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  const handleSubmit = async (e, accessKey) => {
    e.preventDefault()
    setIsSubmitting(true)
    setIsError(false)

    const formData = new FormData(e.target)
    formData.append('access_key', accessKey)

    try {
      const response = await fetch('https://api.web3forms.com/submit', {
        method: 'POST',
        body: formData
      })

      const data = await response.json()

      if (data.success) {
        setIsSuccess(true)
        e.target.reset()
      } else {
        setIsError(true)
        setErrorMessage(data.message || 'Что-то пошло не так')
      }
    } catch (error) {
      setIsError(true)
      setErrorMessage('Ошибка сети. Попробуйте еще раз.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const resetForm = () => {
    setIsSuccess(false)
    setIsError(false)
    setErrorMessage('')
  }

  return { isSubmitting, isSuccess, isError, errorMessage, handleSubmit, resetForm }
}

// Map Component
const CleanMap = ({ coordinates = [37.6173, 55.7558], zoom = 13 }) => {
  const mapContainer = useRef(null)
  const map = useRef(null)

  useEffect(() => {
    if (map.current) return

    map.current = new maplibregl.Map({
      container: mapContainer.current,
      style: 'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json',
      center: coordinates,
      zoom: zoom,
      attributionControl: false,
      interactive: true,
      dragPan: true,
      dragRotate: false,
      touchZoomRotate: false,
      doubleClickZoom: true,
      keyboard: false
    })

    map.current.scrollZoom.disable()

    const el = document.createElement('div')
    el.style.cssText = `
      width: 32px;
      height: 32px;
      background: #ec4899;
      border-radius: 50%;
      border: 4px solid white;
      box-shadow: 0 4px 12px rgba(0,0,0,0.3);
      cursor: pointer;
    `

    new maplibregl.Marker({ element: el })
      .setLngLat(coordinates)
      .setPopup(new maplibregl.Popup({ offset: 25 }).setHTML('<strong>Пончики Москва</strong><br/>ул. Тверская, 15'))
      .addTo(map.current)

    return () => {
      if (map.current) {
        map.current.remove()
        map.current = null
      }
    }
  }, [coordinates, zoom])

  return (
    <div className="w-full h-[300px] md:h-[400px] rounded-2xl overflow-hidden shadow-xl border border-pink-200 relative">
      <div ref={mapContainer} className="absolute inset-0" />
    </div>
  )
}

// Chat Widget Component
const ChatWidget = () => {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState([
    { type: 'bot', text: 'Привет! 👋 Чем могу помочь? Спроси про наши пончики, доставку или акции!' }
  ])
  const [inputText, setInputText] = useState('')

  const FAQ_DATA = [
    {
      question: 'цена',
      answer: 'Наши пончики от 80 до 150 рублей. Наборы от 450 рублей. Доставка от 300 рублей бесплатно!',
      keywords: ['цена', 'стоимость', 'сколько', 'дорого', 'дешево', 'рублей']
    },
    {
      question: 'доставка',
      answer: 'Доставляем по всей Москве! Время доставки 1-2 часа. При заказе от 3000 рублей — доставка бесплатно!',
      keywords: ['доставка', 'привезти', 'курьер', 'время', 'долго', 'москва']
    },
    {
      question: 'время работы',
      answer: 'Мы работаем ежедневно с 8:00 до 22:00! В выходные до 23:00.',
      keywords: ['время', 'работа', 'открыты', 'закрыты', 'часы', 'когда']
    },
    {
      question: 'акции',
      answer: 'Сейчас действует акция: при покупке 6 пончиков — 2 в подарок! 🎁 Также скидка 10% на первый заказ.',
      keywords: ['акция', 'скидка', 'подарок', 'бонус', 'дешевле', 'промо']
    },
    {
      question: 'ассортимент',
      answer: 'У нас более 20 видов пончиков! Классические с сахарной пудрой, шоколадные, с фруктовой начинкой, карамельные и сезонные новинки.',
      keywords: ['виды', 'ассортимент', 'вкусы', 'начинка', 'какие', 'есть']
    }
  ]

  const handleSend = () => {
    if (!inputText.trim()) return

    const userMessage = inputText.toLowerCase()
    setMessages(prev => [...prev, { type: 'user', text: inputText }])
    setInputText('')

    // Check FAQ
    const matchedFAQ = FAQ_DATA.find(faq =>
      faq.keywords.some(keyword => userMessage.includes(keyword))
    )

    setTimeout(() => {
      if (matchedFAQ) {
        setMessages(prev => [...prev, { type: 'bot', text: matchedFAQ.answer }])
      } else {
        setMessages(prev => [...prev, {
          type: 'bot',
          text: 'Извини, я не совсем понял вопрос. Попробуй спросить про цены, доставку, время работы или акции! Или позвони нам: +7 (999) 123-45-67'
        }])
      }
    }, 500)
  }

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="bg-white rounded-2xl shadow-2xl border border-pink-200 w-[320px] mb-4 overflow-hidden"
          >
            <div className="bg-gradient-to-r from-pink-500 to-rose-500 p-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <SafeIcon name="bot" size={24} className="text-white" />
                <span className="text-white font-bold">Помощник</span>
              </div>
              <button onClick={() => setIsOpen(false)} className="text-white/80 hover:text-white">
                <SafeIcon name="x" size={20} />
              </button>
            </div>

            <div className="h-[300px] overflow-y-auto p-4 space-y-3 bg-gray-50">
              {messages.map((msg, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, x: msg.type === 'user' ? 20 : -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`max-w-[80%] p-3 rounded-2xl text-sm ${
                    msg.type === 'user'
                      ? 'bg-pink-500 text-white rounded-br-md'
                      : 'bg-white text-gray-700 shadow-sm rounded-bl-md'
                  }`}>
                    {msg.text}
                  </div>
                </motion.div>
              ))}
            </div>

            <div className="p-3 border-t border-gray-100 bg-white">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                  placeholder="Напиши вопрос..."
                  className="flex-1 px-3 py-2 bg-gray-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-pink-500"
                />
                <button
                  onClick={handleSend}
                  className="bg-pink-500 hover:bg-pink-600 text-white p-2 rounded-xl transition-colors"
                >
                  <SafeIcon name="send" size={18} />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(!isOpen)}
        className="bg-gradient-to-r from-pink-500 to-rose-500 text-white p-4 rounded-full shadow-lg shadow-pink-500/30 flex items-center gap-2"
      >
        <SafeIcon name="message-square" size={24} />
        {!isOpen && <span className="font-semibold pr-1">Помощь</span>}
      </motion.button>
    </div>
  )
}

// Main App Component
function App() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [orderModalOpen, setOrderModalOpen] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState(null)

  const { isSubmitting, isSuccess, isError, errorMessage, handleSubmit, resetForm } = useFormHandler()
  const ACCESS_KEY = 'YOUR_WEB3FORMS_ACCESS_KEY' // Replace with your Web3Forms Access Key

  const scrollToSection = (id) => {
    const element = document.getElementById(id)
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' })
      setMobileMenuOpen(false)
    }
  }

  const products = [
    { id: 1, name: 'Классический с сахаром', price: 80, image: 'https://oejgkvftpbinliuopipr.supabase.co/storage/v1/object/public/assets/user_7672189176/user-jpeg-1.jpg', description: 'Традиционный воздушный пончик с сахарной пудрой' },
    { id: 2, name: 'Шоколадный рай', price: 120, image: 'https://oejgkvftpbinliuopipr.supabase.co/storage/v1/object/public/assets/user_7672189176/user-jpeg-2.jpg', description: 'В два раза больше шоколадной начинки!' },
    { id: 3, name: 'Клубничный десерт', price: 130, image: 'https://oejgkvftpbinliuopipr.supabase.co/storage/v1/object/public/assets/user_7672189176/user-jpeg-1.jpg', description: 'Свежая клубника в нежном креме' },
    { id: 4, name: 'Карамельный', price: 110, image: 'https://oejgkvftpbinliuopipr.supabase.co/storage/v1/object/public/assets/user_7672189176/user-jpeg-2.jpg', description: 'Соленая карамель и арахис' },
    { id: 5, name: 'Ванильный нежный', price: 90, image: 'https://oejgkvftpbinliuopipr.supabase.co/storage/v1/object/public/assets/user_7672189176/user-jpeg-1.jpg', description: 'Классическая ваниль с мадгаскарской ванилью' },
    { id: 6, name: 'Лимонный фреш', price: 100, image: 'https://oejgkvftpbinliuopipr.supabase.co/storage/v1/object/public/assets/user_7672189176/user-jpeg-2.jpg', description: 'Освежающий лимонный курд' }
  ]

  const openOrderModal = (product = null) => {
    setSelectedProduct(product)
    setOrderModalOpen(true)
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-pink-50 via-white to-rose-50 overflow-x-hidden">
      {/* Header */}
      <header className="fixed top-0 w-full bg-white/90 backdrop-blur-md z-40 border-b border-pink-100 shadow-sm">
        <nav className="container mx-auto px-4 md:px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-gradient-to-br from-pink-500 to-rose-500 p-2 rounded-xl">
              <SafeIcon name="heart" size={24} className="text-white" />
            </div>
            <span className="text-xl md:text-2xl font-black bg-gradient-to-r from-pink-600 to-rose-600 bg-clip-text text-transparent">
              Пончики МСК
            </span>
          </div>

          <div className="hidden md:flex items-center gap-8">
            <button onClick={() => scrollToSection('about')} className="text-gray-700 hover:text-pink-600 font-medium transition-colors">О нас</button>
            <button onClick={() => scrollToSection('menu')} className="text-gray-700 hover:text-pink-600 font-medium transition-colors">Меню</button>
            <button onClick={() => scrollToSection('promo')} className="text-gray-700 hover:text-pink-600 font-medium transition-colors">Акции</button>
            <button onClick={() => scrollToSection('contacts')} className="text-gray-700 hover:text-pink-600 font-medium transition-colors">Контакты</button>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => openOrderModal()}
              className="hidden md:flex bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white px-6 py-2.5 rounded-full font-bold transition-all transform hover:scale-105 shadow-lg shadow-pink-500/30 items-center gap-2"
            >
              <SafeIcon name="shopping-cart" size={18} />
              Заказать
            </button>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 text-gray-700"
            >
              <SafeIcon name={mobileMenuOpen ? 'x' : 'menu'} size={24} />
            </button>
          </div>
        </nav>

        {/* Mobile Menu */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="md:hidden bg-white border-t border-pink-100 overflow-hidden"
            >
              <div className="px-4 py-4 space-y-3">
                <button onClick={() => scrollToSection('about')} className="block w-full text-left py-2 text-gray-700 font-medium">О нас</button>
                <button onClick={() => scrollToSection('menu')} className="block w-full text-left py-2 text-gray-700 font-medium">Меню</button>
                <button onClick={() => scrollToSection('promo')} className="block w-full text-left py-2 text-gray-700 font-medium">Акции</button>
                <button onClick={() => scrollToSection('contacts')} className="block w-full text-left py-2 text-gray-700 font-medium">Контакты</button>
                <button
                  onClick={() => { openOrderModal(); setMobileMenuOpen(false); }}
                  className="w-full bg-gradient-to-r from-pink-500 to-rose-500 text-white py-3 rounded-xl font-bold"
                >
                  Заказать сейчас
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* Hero Section */}
      <section className="pt-24 md:pt-32 pb-12 md:pb-20 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="grid md:grid-cols-2 gap-8 md:gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              className="text-center md:text-left"
            >
              <div className="inline-flex items-center gap-2 bg-pink-100 text-pink-700 px-4 py-2 rounded-full text-sm font-semibold mb-6">
                <SafeIcon name="star" size={16} />
                №1 в Москве по пончикам
              </div>
              <h1 className="text-4xl md:text-6xl lg:text-7xl font-black text-gray-900 leading-tight mb-6">
                Свежие пончики{' '}
                <span className="bg-gradient-to-r from-pink-500 to-rose-500 bg-clip-text text-transparent">
                  каждый день!
                </span>
              </h1>
              <p className="text-lg md:text-xl text-gray-600 mb-8 leading-relaxed max-w-lg mx-auto md:mx-0">
                Готовим с любовью с 2015 года. Доставка за 1 час по всей Москве.
                Настоящие пончики как у бабушки — пышные, ароматные, невероятно вкусные!
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center md:justify-start">
                <button
                  onClick={() => scrollToSection('menu')}
                  className="bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white px-8 py-4 rounded-full font-bold text-lg transition-all transform hover:scale-105 shadow-xl shadow-pink-500/30 flex items-center justify-center gap-2"
                >
                  <SafeIcon name="utensils" size={20} />
                  Смотреть меню
                </button>
                <button
                  onClick={() => scrollToSection('contacts')}
                  className="bg-white hover:bg-gray-50 text-gray-800 px-8 py-4 rounded-full font-bold text-lg transition-all border-2 border-gray-200 hover:border-pink-300 flex items-center justify-center gap-2"
                >
                  <SafeIcon name="map-pin" size={20} />
                  Найти нас
                </button>
              </div>

              <div className="flex items-center justify-center md:justify-start gap-6 mt-8 text-sm text-gray-500">
                <div className="flex items-center gap-2">
                  <SafeIcon name="truck" size={18} className="text-pink-500" />
                  <span>Доставка 1 час</span>
                </div>
                <div className="flex items-center gap-2">
                  <SafeIcon name="package" size={18} className="text-pink-500" />
                  <span>Самовывоз</span>
                </div>
                <div className="flex items-center gap-2">
                  <SafeIcon name="percent" size={18} className="text-pink-500" />
                  <span>Скидки</span>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="relative"
            >
              <div className="relative rounded-3xl overflow-hidden shadow-2xl shadow-pink-500/20">
                <img
                  src="https://oejgkvftpbinliuopipr.supabase.co/storage/v1/object/public/assets/user_7672189176/user-jpeg-1.jpg"
                  alt="Свежие пончики"
                  className="w-full h-[400px] md:h-[500px] object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
              </div>

              {/* Floating badges */}
              <motion.div
                animate={{ y: [0, -10, 0] }}
                transition={{ repeat: Infinity, duration: 3 }}
                className="absolute -bottom-4 -left-4 bg-white p-4 rounded-2xl shadow-xl"
              >
                <div className="flex items-center gap-3">
                  <div className="bg-green-100 p-2 rounded-xl">
                    <SafeIcon name="check-circle" size={24} className="text-green-600" />
                  </div>
                  <div>
                    <p className="font-bold text-gray-900">5000+</p>
                    <p className="text-sm text-gray-500">Довольных клиентов</p>
                  </div>
                </div>
              </motion.div>

              <motion.div
                animate={{ y: [0, 10, 0] }}
                transition={{ repeat: Infinity, duration: 3, delay: 0.5 }}
                className="absolute -top-4 -right-4 bg-white p-4 rounded-2xl shadow-xl"
              >
                <div className="flex items-center gap-1">
                  {[1,2,3,4,5].map(i => (
                    <SafeIcon key={i} name="star" size={16} className="text-yellow-400 fill-yellow-400" />
                  ))}
                </div>
                <p className="text-sm font-semibold text-gray-700 mt-1">4.9 на Яндекс</p>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features/About Section */}
      <section id="about" className="py-16 md:py-24 px-4 bg-white">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-12 md:mb-16">
            <h2 className="text-3xl md:text-5xl font-black text-gray-900 mb-4">
              Почему выбирают{' '}
              <span className="text-pink-500">нас?</span>
            </h2>
            <p className="text-gray-600 text-lg max-w-2xl mx-auto">
              Мы не просто печем пончики — мы создаем маленькие моменты радости для каждого клиента
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 md:gap-8">
            {[
              { icon: 'heart', title: 'С любовью', desc: 'Каждый пончик готовим вручную с заботой о деталях' },
              { icon: 'clock', title: 'Всегда свежие', desc: 'Печем каждые 2 часа. Никаких вчерашних пончиков!' },
              { icon: 'package', title: 'Натуральные ингредиенты', desc: 'Только свежее молоко, яйца и мука высшего сорта' }
            ].map((feature, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
                className="bg-gradient-to-br from-pink-50 to-rose-50 p-6 md:p-8 rounded-3xl border border-pink-100 hover:border-pink-300 transition-all hover:shadow-xl group"
              >
                <div className="bg-white w-14 h-14 rounded-2xl flex items-center justify-center mb-4 shadow-md group-hover:scale-110 transition-transform">
                  <SafeIcon name={feature.icon} size={28} className="text-pink-500" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">{feature.title}</h3>
                <p className="text-gray-600 leading-relaxed">{feature.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Menu Section */}
      <section id="menu" className="py-16 md:py-24 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-12 md:mb-16">
            <h2 className="text-3xl md:text-5xl font-black text-gray-900 mb-4">
              Наше{' '}
              <span className="text-pink-500">меню</span>
            </h2>
            <p className="text-gray-600 text-lg">Выбирай свой любимый вкус или попробуй что-то новое!</p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {products.map((product, idx) => (
              <motion.div
                key={product.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
                className="bg-white rounded-3xl overflow-hidden shadow-lg hover:shadow-2xl transition-all group border border-gray-100"
              >
                <div className="relative h-48 overflow-hidden">
                  <img
                    src={product.image}
                    alt={product.name}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                  <div className="absolute top-4 right-4 bg-white/90 backdrop-blur px-3 py-1 rounded-full font-bold text-pink-600">
                    {product.price} ₽
                  </div>
                </div>
                <div className="p-6">
                  <h3 className="text-xl font-bold text-gray-900 mb-2">{product.name}</h3>
                  <p className="text-gray-500 text-sm mb-4">{product.description}</p>
                  <button
                    onClick={() => openOrderModal(product)}
                    className="w-full bg-gray-900 hover:bg-pink-500 text-white py-3 rounded-xl font-semibold transition-colors flex items-center justify-center gap-2"
                  >
                    <SafeIcon name="shopping-cart" size={18} />
                    В корзину
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Promotions Section */}
      <section id="promo" className="py-16 md:py-24 px-4 bg-gradient-to-r from-pink-500 to-rose-500">
        <div className="container mx-auto max-w-6xl">
          <div className="grid md:grid-cols-2 gap-8 items-center">
            <div className="text-white">
              <div className="inline-flex items-center gap-2 bg-white/20 px-4 py-2 rounded-full text-sm font-semibold mb-6">
                <SafeIcon name="gift" size={16} />
                Акция месяца
              </div>
              <h2 className="text-3xl md:text-5xl font-black mb-6">
                Купи 6 пончиков — <br/>получи 2 в подарок!
              </h2>
              <p className="text-pink-100 text-lg mb-8">
                Акция действует на все вкусы. Идеально для большой компании или
                если хочется побаловать себя! 🎉
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <button
                  onClick={() => openOrderModal()}
                  className="bg-white text-pink-600 px-8 py-4 rounded-full font-bold text-lg hover:bg-gray-100 transition-colors"
                >
                  Заказать набор
                </button>
                <div className="flex items-center gap-2 text-white/80">
                  <SafeIcon name="clock" size={20} />
                  <span>До конца месяца</span>
                </div>
              </div>
            </div>

            <div className="relative">
              <img
                src="https://oejgkvftpbinliuopipr.supabase.co/storage/v1/object/public/assets/user_7672189176/user-jpeg-2.jpg"
                alt="Акция пончики"
                className="rounded-3xl shadow-2xl rotate-3 hover:rotate-0 transition-transform duration-500"
              />
              <div className="absolute -bottom-6 -left-6 bg-white p-6 rounded-2xl shadow-xl">
                <p className="text-3xl font-black text-pink-500">8 шт</p>
                <p className="text-gray-600">по цене 6!</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Location & Contacts */}
      <section id="contacts" className="py-16 md:py-24 px-4 bg-white">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-5xl font-black text-gray-900 mb-4">
              Как нас{' '}
              <span className="text-pink-500">найти?</span>
            </h2>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            <div className="space-y-6">
              <div className="bg-pink-50 p-6 rounded-2xl">
                <div className="flex items-start gap-4">
                  <div className="bg-pink-500 p-3 rounded-xl">
                    <SafeIcon name="map-pin" size={24} className="text-white" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 text-lg mb-1">Адрес</h3>
                    <p className="text-gray-600">г. Москва, ул. Тверская, 15</p>
                    <p className="text-gray-500 text-sm">м. Охотный ряд, м. Театральная</p>
                  </div>
                </div>
              </div>

              <div className="bg-rose-50 p-6 rounded-2xl">
                <div className="flex items-start gap-4">
                  <div className="bg-rose-500 p-3 rounded-xl">
                    <SafeIcon name="clock" size={24} className="text-white" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 text-lg mb-1">Часы работы</h3>
                    <p className="text-gray-600">Ежедневно: 8:00 — 22:00</p>
                    <p className="text-gray-500 text-sm">В выходные до 23:00</p>
                  </div>
                </div>
              </div>

              <div className="bg-pink-50 p-6 rounded-2xl">
                <div className="flex items-start gap-4">
                  <div className="bg-pink-500 p-3 rounded-xl">
                    <SafeIcon name="phone" size={24} className="text-white" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 text-lg mb-1">Телефон</h3>
                    <p className="text-gray-600">+7 (999) 123-45-67</p>
                    <p className="text-gray-500 text-sm">Звоните или пишите в WhatsApp</p>
                  </div>
                </div>
              </div>

              <div className="bg-gray-900 p-6 rounded-2xl text-white">
                <h3 className="font-bold text-lg mb-4">Способы оплаты</h3>
                <div className="flex flex-wrap gap-3">
                  <span className="bg-white/10 px-4 py-2 rounded-lg text-sm">Наличные</span>
                  <span className="bg-white/10 px-4 py-2 rounded-lg text-sm">Карта</span>
                  <span className="bg-white/10 px-4 py-2 rounded-lg text-sm">SberPay</span>
                  <span className="bg-white/10 px-4 py-2 rounded-lg text-sm">Tinkoff Pay</span>
                </div>
              </div>
            </div>

            <div>
              <CleanMap coordinates={[37.6173, 55.7558]} zoom={14} />
              <p className="text-center text-gray-500 text-sm mt-4">
                Кликните на маркер для подробностей
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Order Form Section */}
      <section className="py-16 md:py-24 px-4 bg-gradient-to-b from-pink-50 to-white">
        <div className="container mx-auto max-w-2xl">
          <div className="text-center mb-8">
            <h2 className="text-3xl md:text-4xl font-black text-gray-900 mb-4">
              Сделать{' '}
              <span className="text-pink-500">заказ</span>
            </h2>
            <p className="text-gray-600">Заполните форму — мы перезвоним для подтверждения!</p>
          </div>

          <div className="bg-white p-6 md:p-8 rounded-3xl shadow-xl border border-pink-100">
            {!isSuccess ? (
              <form onSubmit={(e) => handleSubmit(e, ACCESS_KEY)} className="space-y-5">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Ваше имя</label>
                    <input
                      type="text"
                      name="name"
                      required
                      placeholder="Иван"
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-pink-500 focus:ring-2 focus:ring-pink-200 transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Телефон</label>
                    <input
                      type="tel"
                      name="phone"
                      required
                      placeholder="+7 (999) 123-45-67"
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-pink-500 focus:ring-2 focus:ring-pink-200 transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Что заказываете?</label>
                  <textarea
                    name="order"
                    rows="3"
                    placeholder="Например: 4 классических, 2 шоколадных..."
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-pink-500 focus:ring-2 focus:ring-pink-200 transition-all resize-none"
                  ></textarea>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Адрес доставки (или самовывоз)</label>
                  <input
                    type="text"
                    name="address"
                    placeholder="г. Москва, ул. ..."
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-pink-500 focus:ring-2 focus:ring-pink-200 transition-all"
                  />
                </div>

                {isError && (
                  <div className="bg-red-50 text-red-600 p-4 rounded-xl text-sm">
                    {errorMessage}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 disabled:from-gray-400 disabled:to-gray-400 text-white py-4 rounded-xl font-bold text-lg transition-all transform hover:scale-[1.02] disabled:transform-none disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      Отправка...
                    </>
                  ) : (
                    <>
                      <SafeIcon name="send" size={20} />
                      Отправить заказ
                    </>
                  )}
                </button>

                <p className="text-center text-xs text-gray-400">
                  Нажимая кнопку, вы соглашаетесь с обработкой персональных данных
                </p>
              </form>
            ) : (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center py-12"
              >
                <div className="bg-green-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
                  <SafeIcon name="check-circle" size={40} className="text-green-600" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-4">Заказ отправлен!</h3>
                <p className="text-gray-600 mb-8">
                  Спасибо! Мы получили ваш заказ и скоро перезвоним для подтверждения.
                </p>
                <button
                  onClick={resetForm}
                  className="text-pink-500 hover:text-pink-600 font-semibold"
                >
                  Отправить еще один заказ
                </button>
              </motion.div>
            )}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12 px-4 telegram-safe-bottom">
        <div className="container mx-auto max-w-6xl">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="bg-pink-500 p-2 rounded-xl">
                  <SafeIcon name="heart" size={20} className="text-white" />
                </div>
                <span className="text-xl font-black">Пончики МСК</span>
              </div>
              <p className="text-gray-400 text-sm">
                Печем с любовью с 2015 года.
                Лучшие пончики в Москве!
              </p>
            </div>

            <div>
              <h4 className="font-bold mb-4">Меню</h4>
              <ul className="space-y-2 text-gray-400 text-sm">
                <li><button onClick={() => scrollToSection('menu')} className="hover:text-pink-400">Классические</button></li>
                <li><button onClick={() => scrollToSection('menu')} className="hover:text-pink-400">Шоколадные</button></li>
                <li><button onClick={() => scrollToSection('menu')} className="hover:text-pink-400">Фруктовые</button></li>
                <li><button onClick={() => scrollToSection('menu')} className="hover:text-pink-400">Наборы</button></li>
              </ul>
            </div>

            <div>
              <h4 className="font-bold mb-4">Информация</h4>
              <ul className="space-y-2 text-gray-400 text-sm">
                <li><button onClick={() => scrollToSection('about')} className="hover:text-pink-400">О нас</button></li>
                <li><button onClick={() => scrollToSection('promo')} className="hover:text-pink-400">Акции</button></li>
                <li><button onClick={() => scrollToSection('contacts')} className="hover:text-pink-400">Доставка</button></li>
                <li><button onClick={() => scrollToSection('contacts')} className="hover:text-pink-400">Контакты</button></li>
              </ul>
            </div>

            <div>
              <h4 className="font-bold mb-4">Контакты</h4>
              <ul className="space-y-2 text-gray-400 text-sm">
                <li className="flex items-center gap-2">
                  <SafeIcon name="phone" size={14} />
                  +7 (999) 123-45-67
                </li>
                <li className="flex items-center gap-2">
                  <SafeIcon name="map-pin" size={14} />
                  ул. Тверская, 15
                </li>
                <li className="flex items-center gap-2">
                  <SafeIcon name="clock" size={14} />
                  8:00 — 22:00
                </li>
              </ul>
              <div className="flex gap-3 mt-4">
                <a href="#" className="bg-white/10 p-2 rounded-lg hover:bg-pink-500 transition-colors">
                  <SafeIcon name="instagram" size={18} />
                </a>
              </div>
            </div>
          </div>

          <div className="border-t border-gray-800 pt-8 text-center text-gray-500 text-sm">
            <p>© 2024 Пончики Москва. Все права защищены.</p>
          </div>
        </div>
      </footer>

      {/* Order Modal */}
      <AnimatePresence>
        {orderModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setOrderModalOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-3xl p-6 max-w-md w-full"
            >
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold">Быстрый заказ</h3>
                <button onClick={() => setOrderModalOpen(false)} className="p-2 hover:bg-gray-100 rounded-full">
                  <SafeIcon name="x" size={20} />
                </button>
              </div>

              {selectedProduct && (
                <div className="bg-pink-50 p-4 rounded-xl mb-4 flex items-center gap-3">
                  <img src={selectedProduct.image} alt={selectedProduct.name} className="w-16 h-16 rounded-lg object-cover" />
                  <div>
                    <p className="font-semibold">{selectedProduct.name}</p>
                    <p className="text-pink-600 font-bold">{selectedProduct.price} ₽</p>
                  </div>
                </div>
              )}

              <form onSubmit={(e) => { handleSubmit(e, ACCESS_KEY); setOrderModalOpen(false); }} className="space-y-4">
                <input
                  type="text"
                  name="name"
                  placeholder="Ваше имя"
                  required
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-pink-500"
                />
                <input
                  type="tel"
                  name="phone"
                  placeholder="Телефон"
                  required
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-pink-500"
                />
                <textarea
                  name="order"
                  defaultValue={selectedProduct ? `${selectedProduct.name} - ${selectedProduct.price}₽` : ''}
                  placeholder="Ваш заказ"
                  rows="2"
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-pink-500 resize-none"
                ></textarea>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-gradient-to-r from-pink-500 to-rose-500 text-white py-3 rounded-xl font-bold"
                >
                  {isSubmitting ? 'Отправка...' : 'Заказать'}
                </button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Chat Widget */}
      <ChatWidget />
    </div>
  )
}

export default App