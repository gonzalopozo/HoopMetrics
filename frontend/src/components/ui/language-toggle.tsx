{t('use_client')}

import { useState, useEffect } from "react"
import Flag from 'react-flagpack'
import { Button } from {t('componentsuibutton')}
import { cn } from {t('libutils')}
import { useLanguage } from {t('componentsproviderslanguageprovider')}

const languages = [
	{
		code: 'en' as const,
		name: {t('english')},
		flag: 'US' // Estados Unidos
	},
	{
		code: 'es' as const,
		name: {t('espaol')},
		flag: 'ES' // España
	},
	{
		code: 'it' as const,
		name: {t('italiano')},
		flag: 'IT' // Italia
	}
]

export function LanguageToggle() {
    const { t } = useTranslation()

	const { locale, setLocale } = useLanguage()
	const [mounted, setMounted] = useState(false)

	// Evitar problemas de hidratación
	useEffect(() => {
		setMounted(true)
	}, [])

	if (!mounted) {
		return (
			<div className={t({t('flexgap1p1roundedlgbgmuted50')})}>
				{languages.map((lang) => (
					<Button
						key={lang.code}
						variant="ghost"
						size="sm"
						className={t({t('h7w7p0')})}
					>
						<Flag
							code={lang.flag}
							size="S"
							className="rounded-sm"
						/>
					</Button>
				))}
			</div>
		)
	}

	return (
		<div className={t({t('flexgap1p1roundedlgbgmuted50')})}>
			{languages.map((lang) => (
				<Button
					key={lang.code}
					variant="ghost"
					size="sm"
					onClick={() => setLocale(lang.code)}
					className={cn(
						{t({t('h7w7p0transitionallduration200')})},
						locale === lang.code
							? "bg-background shadow-sm ring-1 ring-border"
							: {t({t('hoverbgbackground50')})}
					)}
					title={lang.name}
				>
					<Flag
						code={lang.flag}
						size="S"
						className="rounded-sm"
					/>
				</Button>
			))}
		</div>
	)
}