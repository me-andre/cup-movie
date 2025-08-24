import { Card, CardContent, CardHeader, CardMedia, Typography } from '@mui/material';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import rehypeSanitize from 'rehype-sanitize';

interface MovieCardProps {
    show: {
        name: string;
        premiered: string | null;
        summary: string | null;
        image: {
            medium: string;
        } | null;
    } | undefined;
}

export const MovieCard = ({ show }: MovieCardProps) => {
    if (!show) {
        return (
            <Card sx={{ flexShrink: 0, width: ({ spacing }) => spacing(40) }} elevation={5}>
                <CardContent>
                    <Typography variant="body1">
                        Select a genre and a show to see details.
                    </Typography>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card sx={{ flexShrink: 0, width: ({ spacing }) => spacing(40) }} elevation={5}>
            <CardHeader
                title={show.premiered}
                subheader={show.name}
            />
            <CardMedia
                image={show.image?.medium}
                title={show.name}
                sx={{ height: ({ spacing }) => spacing(40) }}
            />
            <CardContent>
                <Typography variant="body2">
                    <Markdown
                        remarkPlugins={[remarkGfm]}
                        rehypePlugins={[rehypeRaw, rehypeSanitize]}
                    >
                        {show.summary}
                    </Markdown>
                </Typography>
            </CardContent>
        </Card>
    )
}