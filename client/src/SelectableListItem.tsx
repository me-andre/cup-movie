import { ListItemButton, type ListItemButtonProps, ListItemText } from '@mui/material';

interface SelectableListItemProps extends ListItemButtonProps {
    selected?: boolean;
}

export const SelectableListItem = ({ selected, children, ...props }: SelectableListItemProps) => {
    return (
        <ListItemButton
            sx={{
                backgroundColor: selected ? 'primary.main' : 'transparent',
                color: selected ? 'primary.contrastText' : 'text.primary',
                '&:hover': {
                    color: 'text.primary',
                },
            }}
            {...props}
        >
            <ListItemText primary={children} />
        </ListItemButton>

    );
};