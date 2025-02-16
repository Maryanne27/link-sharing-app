import { useContext, useEffect, useRef, useState } from 'react'
import NoLinks from './NoLinks'
import Button from '@/app/components/Button'
import EditableLinks from '../../components/editableLinks/Editablelinks'
import { DataContext } from '../../../contexts/DataContext'
import useForm from '../../../hooks/useForm'
// import Toast from '../../../components/toast/Toast'
import SavedIcon from '../../../assets/SavedIcon'
import Toast from '@/app/components/toast/Toast'

export default function Links() {
    const {
        links,
        addLink,
        reorderLinks,
        saveLinksToDb
    } = useContext(DataContext)

    const [dragIdx, setDragIdx] = useState<null | number>(null)
    const [targetLink, setTargetLink] = useState<null | Link>(null)

    const linksRef = useRef<HTMLDivElement>(null)
    const copyRef = useRef<HTMLDivElement>(null)

    const {
        validateURL,
        submitForm,
        success
    } = useForm(saveLinksToDb)

    const dragEventListener = (e: MouseEvent) => {
        const mousePosition = e.clientY
    
        if (linksRef.current && copyRef.current) {
            const children = [...linksRef.current.children].filter(child => (
                child.getAttribute('data-copy') !== 'true'
            ))
        
            const { top, height } = linksRef.current.getBoundingClientRect()
            const divHeight = copyRef.current.getBoundingClientRect().height

            const maxHeight = 0
            const minHeight = height - divHeight

            const newPosition = mousePosition - top - 30

            copyRef.current.style.top
                = newPosition < maxHeight ? maxHeight + 'px'
                : newPosition > minHeight ? minHeight + 'px'
                : newPosition + 'px'

            children.forEach((child, idx) => {
                const childTop = (child as HTMLDivElement).offsetTop

                if (Math.abs(childTop - newPosition) < 100 && idx !== dragIdx && copyRef.current) {
                    reorderLinks(copyRef.current.id, idx)
                }
            })
        }
    }
    
    const startDrag = (id: string) => {
        const targetLink = links.find(link => link.id === id)

        if (!targetLink) return

        const targetIdx = links.indexOf(targetLink)

        setDragIdx(targetIdx)

        setTargetLink(targetLink)

        window.addEventListener('mousemove', dragEventListener)

        window.addEventListener('mouseup', endDrag)
    }

    const endDrag = () => {
        if (copyRef.current) {
            if (copyRef.current.parentElement) {
                copyRef.current.style.top = ''

                setTargetLink(null)
                setDragIdx(null)

                window.removeEventListener('mousemove', dragEventListener)
            }
        }
    }

    const handleSave = () => {
        let isValid = true

        links.forEach(link => {
            if (!validateURL(link)) {
                isValid = false
            }
        })

        if (!isValid) {
            return
        }

        submitForm()
    }

    useEffect(() => {
        if (targetLink && copyRef.current && dragIdx != null) {
            const { height } = copyRef.current.getBoundingClientRect()

            const initialTop = (dragIdx * height) + 'px'

            copyRef.current.style.top = initialTop
        }
    }, [targetLink, dragIdx])

    return (
        <>
            <section className="p-6 bg-white rounded-lg shadow-md">

                <div className="mb-4">
                    <h3 className="text-lg font-semibold">Customize your links</h3>
                    <p className="text-sm text-gray-500">
                        Add/edit/remove links below and then share all your profiles with the world!
                    </p>
                    <Button alt onClick={addLink}>
                        &#43; Add new link
                    </Button>
                </div>

                <div ref={linksRef} className="mb-4">
                    {links?.length > 0 ? (
                        links.map((link, idx) => (
                            <EditableLinks
                                key={link.id}
                                index={idx}
                                isDragging={targetLink?.id === link.id}
                                startDrag={startDrag}
                                { ...link }
                            />
                        ))
                    ) : (
                        <NoLinks />
                    )}

                    {targetLink && <EditableLinks
                        index={dragIdx}
                        copyRef={copyRef}
                        isDragging={false}
                        startDrag={null}
                        { ...targetLink }
                    />}
                </div>

                <div className="mt-4">
                    <Button
                        disabled={!links || links.length === 0}
                        onClick={handleSave}
                    >
                        Save
                    </Button>
                </div>

            </section>

            <Toast isVisible={success}>
                <SavedIcon />
                <span>Your changes have been successfully saved!</span>
            </Toast>
        </>
    )
}
