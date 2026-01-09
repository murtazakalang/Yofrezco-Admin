import React, { useState } from 'react';
import {
    Box,
    Typography,
    Accordion,
    AccordionSummary,
    AccordionDetails,
    useTheme,
    Button,
    Stack
} from '@mui/material';
import PersonIcon from '@mui/icons-material/Person';
import StorefrontIcon from '@mui/icons-material/Storefront';
import DirectionsCarIcon from '@mui/icons-material/DirectionsCar';
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';
import Link from 'next/link';
import { t } from 'i18next';
import CustomContainer from 'components/container';

interface FaqItem {
    id: number;
    question: string;
    answer: string;
    user_type: string;
    status: number;
}

interface FaqSectionData {
    faq_section_status: number;
    faq_title: string;
    faq_list: FaqItem[];
}

interface FaqPageProps {
    faq_section?: FaqSectionData;
    configData?: any;
}

const FaqPage: React.FC<FaqPageProps> = ({ faq_section, configData }) => {
    const theme = useTheme();
    const [activeTab, setActiveTab] = useState(0);
    const [expandedAccordion, setExpandedAccordion] = useState<number | false>(false);

    // Filter FAQ data
    const dynamicCustomerFaqs = faq_section?.faq_list?.filter(
        faq => faq.user_type === 'customer' && faq.status === 1
    );

    const dynamicSellerFaqs = faq_section?.faq_list?.filter(
        faq => faq.user_type === 'restaurant' && faq.status === 1
    );

    const dynamicDriverFaqs = faq_section?.faq_list?.filter(
        faq => faq.user_type === 'deliveryman' && faq.status === 1
    );

    // Build dynamic tabs
    const tabs = [];

    if (dynamicCustomerFaqs?.length) {
        tabs.push({
            label: "I'm a Customer",
            icon: <PersonIcon />,
            type: "customer"
        });
    }

    if (dynamicSellerFaqs?.length) {
        tabs.push({
            label: "I'm a Seller",
            icon: <StorefrontIcon />,
            type: "restaurant"
        });
    }

    if (dynamicDriverFaqs?.length) {
        tabs.push({
            label: "I'm a Rider",
            icon: <DirectionsCarIcon />,
            type: "deliveryman"
        });
    }

    // Get current FAQ list
    const getCurrentFaqs = () => {
        const tabType = tabs[activeTab]?.type;

        if (tabType === "customer") return dynamicCustomerFaqs;
        if (tabType === "restaurant") return dynamicSellerFaqs;
        if (tabType === "deliveryman") return dynamicDriverFaqs;

        return [];
    };

    const handleAccordionChange = (panel: number) => (_event: any, isExpanded: boolean) => {
        setExpandedAccordion(isExpanded ? panel : false);
    };

    const handleTabChange = (index: number) => {
        setActiveTab(index);
        setExpandedAccordion(false);
    };

    // If no FAQs available, show a message
    if (!faq_section?.faq_list?.length || tabs.length === 0) {
        return (
            <CustomContainer>
                <Box sx={{ py: 6, textAlign: 'center' }}>
                    <Typography variant="h4" sx={{ mb: 2, fontWeight: 700 }}>
                        {t('Frequently Asked Questions')}
                    </Typography>
                    <Typography color="text.secondary">
                        {t('No FAQs available at the moment.')}
                    </Typography>
                </Box>
            </CustomContainer>
        );
    }

    return (
        <CustomContainer>
            <Box component="section" sx={{ py: { xs: 4, md: 6 }, minHeight: '60vh' }}>
                {/* Title */}
                <Box textAlign="center" mb={4}>
                    <Typography
                        variant="h1"
                        sx={{
                            fontSize: { xs: '24px', md: '2.5rem' },
                            fontWeight: 700,
                            color: theme.palette.text.primary,
                        }}
                    >
                        {faq_section?.faq_title || t('Frequently Asked Questions')}
                    </Typography>
                </Box>

                {/* Dynamic Tabs */}
                <Box sx={{ mb: 4, display: 'flex', justifyContent: 'center' }}>
                    <Box
                        sx={{
                            display: 'flex',
                            backgroundColor: theme.palette.neutral[100],
                            borderRadius: '8px',
                            p: 1,
                            gap: 0.5,
                            boxShadow: "0px 5px 15px -2px #1C1E201A",
                        }}
                    >
                        {tabs.map((tab, index) => (
                            <Box
                                key={index}
                                onClick={() => handleTabChange(index)}
                                sx={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 1,
                                    px: { xs: 1.5, md: 3 },
                                    py: 1.5,
                                    cursor: 'pointer',
                                    fontSize: { xs: '0.85rem', md: '1rem' },
                                    fontWeight: 600,
                                    borderRadius: '6px',
                                    backgroundColor:
                                        activeTab === index
                                            ? theme.palette.primary.main
                                            : 'transparent',
                                    color:
                                        activeTab === index
                                            ? '#fff'
                                            : theme.palette.text.secondary,
                                    transition: 'all 0.2s ease',
                                    '&:hover': {
                                        backgroundColor:
                                            activeTab === index
                                                ? theme.palette.primary.main
                                                : theme.palette.neutral[200],
                                    },
                                }}
                            >
                                {tab.icon}
                                <Typography sx={{
                                    display: { xs: 'none', sm: 'block' },
                                    color: 'inherit',
                                    fontWeight: 'inherit',
                                }}>
                                    {t(tab.label)}
                                </Typography>
                            </Box>
                        ))}
                    </Box>
                </Box>

                {/* FAQ List */}
                <Box sx={{ maxWidth: '900px', mx: 'auto' }}>
                    {getCurrentFaqs()?.map(faq => (
                        <Accordion
                            key={faq.id}
                            expanded={expandedAccordion === faq.id}
                            onChange={handleAccordionChange(faq.id)}
                            sx={{
                                mb: 2,
                                borderRadius: '12px !important',
                                boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
                                '&:before': { display: 'none' },
                                overflow: 'hidden',
                            }}
                        >
                            <AccordionSummary
                                expandIcon={
                                    expandedAccordion === faq.id
                                        ? <RemoveIcon sx={{ color: theme.palette.primary.main }} />
                                        : <AddIcon sx={{ color: theme.palette.primary.main }} />
                                }
                                sx={{
                                    backgroundColor: expandedAccordion === faq.id
                                        ? theme.palette.neutral[100]
                                        : theme.palette.background.paper,
                                    py: 1,
                                }}
                            >
                                <Typography
                                    sx={{
                                        fontSize: { xs: '0.9rem', md: '1.1rem' },
                                        fontWeight: 600,
                                        color:
                                            expandedAccordion === faq.id
                                                ? theme.palette.primary.main
                                                : theme.palette.text.primary,
                                    }}
                                >
                                    {faq.question}
                                </Typography>
                            </AccordionSummary>

                            <AccordionDetails
                                sx={{
                                    backgroundColor: theme.palette.neutral[100],
                                    py: 2,
                                    px: 3,
                                }}
                            >
                                <Typography sx={{ fontSize: '0.95rem', color: theme.palette.text.secondary, lineHeight: 1.7 }}>
                                    {faq.answer}
                                </Typography>
                            </AccordionDetails>
                        </Accordion>
                    ))}
                </Box>

                {/* Contact Box */}
                <Stack
                    direction={{ xs: 'column', sm: 'row' }}
                    justifyContent="space-between"
                    alignItems={'center'}
                    spacing={{ xs: 2, md: 3 }}
                    sx={{
                        maxWidth: '900px',
                        mx: 'auto',
                        mt: 5,
                        backgroundColor: theme.palette.neutral[200],
                        px: { xs: "20px", md: "30px" },
                        py: '20px',
                        borderRadius: '16px',
                    }}
                >
                    <Stack direction="row" alignItems="center" spacing={2}>
                        <Box
                            sx={{
                                backgroundColor: theme.palette.neutral[100],
                                padding: '10px',
                                borderRadius: '50%',
                                width: { xs: '45px', md: '55px' },
                                height: { xs: '45px', md: '55px' },
                                display: 'flex',
                                justifyContent: 'center',
                                alignItems: 'center',
                            }}
                        >
                            <Typography fontSize={{ xs: '24px', md: '28px' }}>❓</Typography>
                        </Box>

                        <Box>
                            <Typography fontWeight="700" fontSize={{ xs: '18px', sm: '22px' }}>
                                {t('Still have questions?')}
                            </Typography>
                            <Typography fontSize={{ xs: '13px', sm: '15px' }} color="text.secondary">
                                {t("We're just a click away if you have more questions.")}
                            </Typography>
                        </Box>
                    </Stack>

                    <Button
                        variant="contained"
                        color="primary"
                        sx={{
                            textTransform: 'none',
                            px: 4,
                            py: 1.5,
                            borderRadius: '8px',
                            fontWeight: 600,
                        }}
                    >
                        <Link href={`tel:${configData?.phone}`} style={{ color: "white", textDecoration: 'none' }}>
                            {t('Contact Us')}
                        </Link>
                    </Button>
                </Stack>
            </Box>
        </CustomContainer>
    );
};

export default FaqPage;
