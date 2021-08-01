import Head from 'next/head'
import Logo from './Logo'
import Link from 'next/link'

interface PageProps {
    content: JSX.Element
}

function Page(props: PageProps): JSX.Element {

    return (
        <div className="md:w-2/3 xl:w-2/5 md:mx-auto flex flex-col min-h-screen justify-center px-5 py-12">
            <Head>
                <title>CovidPass</title>
                <link rel="icon" href="/favicon.ico"/>
            </Head>
            <div>
                <main className="flex flex-col space-y-5">
                    <Logo/>

                    {props.content}

                    {/* <footer>
                        <nav className="nav flex pt-4 flex-row space-x-4 justify-center text-md font-bold flex-wrap">
                            <a href="https://ko-fi.com/marvinsxtr" className="hover:underline">{t('common:donate')}</a>
                            <a href="https://github.com/marvinsxtr/covidpass" className="hover:underline">{t('common:gitHub')}</a>
                            <Link href="/privacy"><a className="hover:underline">{t('common:privacyPolicy')}</a></Link>
                            <Link href="/imprint"><a className="hover:underline">{t('common:imprint')}</a></Link>
                        </nav>
                    </footer> */}
                </main>
            </div>
        </div>
    )
}

export default Page