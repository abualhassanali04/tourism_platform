import { Link } from 'react-router-dom'
import { Landmark, Church, Castle, TreePalm, MapPin } from 'lucide-react'
import { useI18n } from '../i18n/I18nContext'
import { imageUrl } from '../utils/helpers'

export const CATEGORY_ICON = { Archaeological: Landmark, Religious: Church, Heritage: Castle, Nature: TreePalm, Other: MapPin }

export default function PlaceCard({ place }) {
  const { isRtl } = useI18n()
  const Icon = CATEGORY_ICON[place.category] || MapPin
  const img = imageUrl(place.coverImageUrl)
  return (
    <Link to={`/places/${place.id}`} className="card">
      <div className={`media cat-${place.category}`}>
        {img ? <img src={img} alt={place.name} loading="lazy" /> : <Icon size={46} strokeWidth={1.4} />}
        <span className="badge badge-success">{place.category}</span>
      </div>
      <div className="card-pad">
        <h3 lang={isRtl ? 'ar' : 'en'}>{isRtl ? place.nameAr || place.name : place.name}</h3>
        <p className="muted small" lang={isRtl ? 'en' : 'ar'} dir={isRtl ? 'ltr' : 'rtl'} style={{ margin: 0 }}>{isRtl ? place.name : place.nameAr}</p>
        <p className="small" lang={isRtl ? 'ar' : 'en'} dir={isRtl ? 'rtl' : 'ltr'} style={{ marginBlock: '6px' }}>{isRtl ? place.shortDescriptionAr || place.shortDescription : place.shortDescription}</p>
        <span className="pill pill-green">{place.governorateName}</span>
      </div>
    </Link>
  )
}
