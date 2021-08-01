import {NextSeo} from 'next-seo';

import Form from '../components/Form';
import Card from '../components/Card';
import Page from '../components/Page';

function Index(): JSX.Element {

    const title = 'CovidPass';
    const description = 'Add your EU Digital COVID Certificates to your favorite wallet app.';

    return (
        <>
            <NextSeo
                title={title}
                description={description}
                openGraph={{
                    url: 'https://covidpass.marvinsextro.de/',
                    title: title,
                    description: description,
                    images: [
                        {
                            url: 'https://covidpass.marvinsextro.de/thumbnail.png',
                            width: 1000,
                            height: 500,
                            alt: description,
                        }
                    ],
                    site_name: title,
                }}
                twitter={{
                    handle: '@marvinsxtr',
                    site: '@marvinsxtr',
                    cardType: 'summary_large_image',
                }}
            />
            <Page content={
                <div className="space-y-5">
                    <Card content={
                        <p>Add your EU Digital COVID Certificates to your favorite wallet apps.&nbsp;On iOS, please use the Safari Browser.</p>
                    }/>

                    <Form/>
                </div>
            }/>
        </>
    )
}


export default Index;
