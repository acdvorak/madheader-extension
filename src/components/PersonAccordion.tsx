import { useMemo, useState } from 'react';
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  accordionSummaryClasses,
  Box,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';

import { C } from '@/components/InlineCode';
import { caseInsensitive, isTruthy } from '@/utils/global-utils';

import { MuiLink } from '../theme/components/MuiLink';
import { color } from '../theme/themeConstants';
import type { ScalarSx } from '../theme/themeTypes';

export interface PersonAccordionItem {
  key: string;
  title: string;
  label: React.ReactNode;
}

interface BasePersonAccordionProps {
  title: React.ReactNode;
  // eslint-disable-next-line @typescript-eslint/consistent-type-imports
  Icon?: typeof import('@mui/icons-material/People').default;
  expanded?: boolean;
  defaultExpanded?: boolean;
  onChange?: (expanded: boolean) => void;
}

export type PersonAccordionProps = BasePersonAccordionProps &
  (
    | {
        items: PersonAccordionItem[];
        showDiffer?: boolean;
        differLabel?: string;
        children?: undefined;
      }
    | {
        items?: undefined;
        showDiffer?: undefined;
        differLabel?: undefined;
        children: React.ReactNode;
      }
  );

export const PersonAccordion: React.FC<PersonAccordionProps> = ({
  title,
  Icon,
  items,
  children,
  showDiffer,
  differLabel,
  expanded,
  defaultExpanded,
  onChange,
}) => {
  const [pastedText, setPastedText] = useState('');

  const pastedGroupNamesUpper = useMemo((): Set<Uppercase<string>> => {
    return new Set<Uppercase<string>>(
      pastedText
        .split(/(?:\r?\n)+/)
        .map((line) => line.trim())
        .map((line): string | null => {
          return /^[A-Z][A-Z0-9]*(?:-[a-zA-Z0-9-]+)+/.exec(line)?.[0] ?? null;
        })
        .filter(isTruthy)
        .filter((groupName) => groupName.length >= 4)
        .map((groupName) => groupName.toUpperCase() as Uppercase<string>)
        .sort(caseInsensitive),
    );
  }, [pastedText]);

  const actualGroupNamesUpper = useMemo((): Set<Uppercase<string>> => {
    return new Set(
      (items ?? [])
        .map((item): Uppercase<string> | null => {
          return typeof item.label === 'string'
            ? (item.label.toUpperCase() as Uppercase<string>)
            : null;
        })
        .filter(isTruthy)
        .sort(caseInsensitive),
    );
  }, [items]);

  return (
    <Accordion
      expanded={expanded}
      defaultExpanded={defaultExpanded}
      onChange={(event, shouldExpand: boolean) => {
        onChange?.(shouldExpand);
      }}
    >
      <AccordionSummary
        expandIcon={<ExpandMoreIcon />}
        sx={{
          '&, &.Mui-expanded': {
            minHeight: '2.5em',
          },

          '& .MuiAccordionSummary-content': {
            margin: 0,
          },

          // Override default padding
          padding: '0 8px',

          // Place chevron icon on the LEFT side
          flexDirection: 'row-reverse',
          [`& .${accordionSummaryClasses.expandIconWrapper}`]: {
            mr: 1, // Adds a little spacing between the icon and your text
          },
        }}
      >
        <Stack direction="row" sx={{ gap: 1, flexGrow: 1 }}>
          {Icon && (
            <Box
              sx={{
                color: color('text.secondary'),
                [`.${accordionSummaryClasses.root}:hover &`]: {
                  color: color('text.primary'),
                },
              }}
            >
              <Icon fontSize="small" />
            </Box>
          )}
          <Typography
            component="div"
            sx={{ lineHeight: 1.6, display: 'flex', flexGrow: 1 }}
          >
            {title}
          </Typography>
        </Stack>
      </AccordionSummary>

      <AccordionDetails>
        {items?.length ? (
          <Stack direction="row" sx={{ gap: 2 }}>
            <Box component="ul" sx={{ marginY: 1, flex: '1 0' }}>
              {items.map((item) => {
                let sx: ScalarSx | undefined = undefined;
                const upper =
                  typeof item.label === 'string'
                    ? (item.label.toUpperCase() as Uppercase<string>)
                    : undefined;
                if (pastedGroupNamesUpper.size > 0 && upper) {
                  if (pastedGroupNamesUpper.has(upper)) {
                    sx = {
                      color: color('success.main'),
                    };
                  } else {
                    sx = {
                      color: color('error.main'),
                    };
                  }
                }
                return (
                  <li title={item.title} key={item.key}>
                    <C sx={sx}>{item.label}</C>
                  </li>
                );
              })}
            </Box>

            {showDiffer && (
              <>
                <Box component="ul" sx={{ marginY: 1, flex: '1 0' }}>
                  {[...pastedGroupNamesUpper].map((groupNameUpper) => {
                    let sx: ScalarSx;
                    if (actualGroupNamesUpper.has(groupNameUpper)) {
                      sx = {
                        color: color('success.main'),
                      };
                    } else {
                      sx = {
                        color: color('error.main'),
                      };
                    }
                    return (
                      <li key={groupNameUpper}>
                        <C sx={sx}>{groupNameUpper}</C>
                      </li>
                    );
                  })}
                </Box>

                <Box sx={{ marginY: 1, flex: '1 1' }}>
                  <TextField
                    label="Compare to"
                    placeholder={`Paste a list of ${differLabel || 'AD Groups or App Funcs'}, one per line, to diff them against this LDAP account.`}
                    multiline
                    fullWidth
                    value={pastedText}
                    onChange={(evt) => {
                      setPastedText(evt.target.value);
                    }}
                    sx={{
                      height: '100%',
                      '& .MuiInputBase-root': {
                        height: '100%',
                        alignItems: 'flex-start',
                      },
                      '& .MuiOutlinedInput-root': { height: '100%' },
                    }}
                    slotProps={{
                      inputLabel: { shrink: true },
                      input: { sx: { fontFamily: 'monospace' } },
                    }}
                    helperText={
                      <>
                        Example:{' '}
                        <MuiLink href="https://confluence.nml.com/spaces/IPS/pages/1331015671/Future+Wealth+Proposal+-+Team+member+access">
                          Team member access
                        </MuiLink>
                      </>
                    }
                  />
                </Box>
              </>
            )}
          </Stack>
        ) : (
          children
        )}
      </AccordionDetails>
    </Accordion>
  );
};
